import { database } from './firebase';
import { ref, onValue, set, remove, push, serverTimestamp } from 'firebase/database';
import type { TldrawEditor } from 'tldraw';

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: {
    x: number;
    y: number;
  } | null;
  viewport: {
    x: number;
    y: number;
    z: number;
  } | null;
  lastActivity: any; // Firebase server timestamp
}

export interface VoiceAnnotation {
  id: string;
  userId: string;
  userName: string;
  position: { x: number; y: number };
  audioUrl: string;
  transcript?: string;
  timestamp: any; // Firebase server timestamp
}

// Note: CollaborationService is now deprecated in favor of tldraw's built-in sync
// Keeping VoiceAnnotation interface for potential future voice features

export class CollaborationService {
  private editor: any = null;
  private roomId: string;
  private userId: string;
  private userName: string;
  private userColor: string;
  private presenceRef: any;
  private unsubscribers: Array<() => void> = [];

  constructor(roomId: string, userId?: string, userName?: string) {
    this.roomId = roomId;
    this.userId = userId || this.generateUserId();
    this.userName = userName || `User ${this.userId.slice(-4)}`;
    this.userColor = this.generateUserColor();
    
    console.log('🤝 Collaboration initialized:', {
      roomId: this.roomId,
      userId: this.userId,
      userName: this.userName,
      userColor: this.userColor
    });
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  public setEditor(editor: any) {
    console.log('Setting editor for collaboration service:', {
      roomId: this.roomId,
      userId: this.userId,
      userName: this.userName
    });
    
    this.editor = editor;
    
    // Small delay to ensure editor is fully initialized
    setTimeout(() => {
      this.setupRealtimeSync();
      this.setupPresenceTracking();
    }, 100);
  }

  private setupRealtimeSync() {
    if (!this.editor) return;

    console.log(`Setting up realtime sync for room: ${this.roomId}, user: ${this.userId}`);

    // Listen for canvas data changes from other users
    const canvasRef = ref(database, `rooms/${this.roomId}/canvas`);
    
    const unsubscribe = onValue(canvasRef, (snapshot) => {
      const canvasData = snapshot.val();
      console.log('Received canvas data:', {
        hasData: !!canvasData,
        lastUpdatedBy: canvasData?.lastUpdatedBy,
        currentUser: this.userId,
        timestamp: canvasData?.timestamp
      });
      
      if (canvasData && this.editor) {
        // Only sync if the data is from another user
        const lastUpdatedBy = canvasData.lastUpdatedBy;
        if (lastUpdatedBy && lastUpdatedBy !== this.userId) {
          try {
            console.log('Syncing canvas data from user:', lastUpdatedBy);
            // Load the canvas state with sanitized data
            const sanitizedSnapshot = this.sanitizeSnapshotForFirebase(canvasData.snapshot, false);
            
            // Use loadSnapshot to replace the entire state
            this.editor.loadSnapshot(sanitizedSnapshot);
            console.log('Successfully synced canvas from other user');
          } catch (error) {
            console.error('Error loading canvas snapshot:', error);
          }
        } else {
          console.log('Ignoring canvas update from self or invalid source');
        }
      }
    });

    this.unsubscribers.push(unsubscribe);

    // Save canvas changes to Firebase
    const saveCanvasState = () => {
      if (!this.editor) return;
      
      try {
        const snapshot = this.editor.getSnapshot();
        console.log('Saving canvas state for user:', this.userId);
        
        // Sanitize snapshot keys for Firebase
        const sanitizedSnapshot = this.sanitizeSnapshotForFirebase(snapshot, true);
        
        set(ref(database, `rooms/${this.roomId}/canvas`), {
          snapshot: sanitizedSnapshot,
          lastUpdatedBy: this.userId,
          timestamp: serverTimestamp()
        }).then(() => {
          console.log('Canvas state saved successfully');
        }).catch((error) => {
          console.error('Failed to save canvas state:', error);
        });
      } catch (error) {
        console.error('Error preparing canvas state for save:', error);
      }
    };

    // Reduced debounce time for better real-time experience
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveCanvasState, 200); // Reduced from 500ms to 200ms
    };

    // Listen for editor changes
    this.editor.on('change', (info: any) => {
      console.log('Editor changed, scheduling save:', info);
      debouncedSave();
    });
    
    console.log('Realtime sync setup complete');
  }

  private sanitizeSnapshotForFirebase(snapshot: any, forSaving: boolean): any {
    if (!snapshot) return snapshot;

    const sanitized = JSON.parse(JSON.stringify(snapshot));

    // Function to sanitize keys recursively
    const sanitizeKeys = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeKeys);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Replace invalid Firebase characters with safe alternatives
        let sanitizedKey = key;
        if (forSaving) {
          sanitizedKey = key
            .replace(/\./g, '_DOT_')
            .replace(/#/g, '_HASH_')
            .replace(/\$/g, '_DOLLAR_')
            .replace(/\//g, '_SLASH_')
            .replace(/\[/g, '_LBRACKET_')
            .replace(/\]/g, '_RBRACKET_');
        } else {
          // Restore keys when loading
          sanitizedKey = key
            .replace(/_DOT_/g, '.')
            .replace(/_HASH_/g, '#')
            .replace(/_DOLLAR_/g, '$')
            .replace(/_SLASH_/g, '/')
            .replace(/_LBRACKET_/g, '[')
            .replace(/_RBRACKET_/g, ']');
        }
        
        result[sanitizedKey] = sanitizeKeys(value);
      }
      
      return result;
    };

    return sanitizeKeys(sanitized);
  }

  private setupPresenceTracking() {
    if (!this.editor) return;

    console.log('Setting up presence tracking for user:', this.userId);
    
    this.presenceRef = ref(database, `rooms/${this.roomId}/presence/${this.userId}`);
    
    // Set initial presence
    this.updatePresence();

    // Update presence on cursor movement
    const handlePointerMove = (e: any) => {
      const point = this.editor?.screenToPage(e.clientX, e.clientY);
      if (point) {
        this.updatePresence(point);
      }
    };

    const handleViewportChange = () => {
      this.updatePresence();
    };

    // Listen for pointer and viewport changes  
    document.addEventListener('mousemove', handlePointerMove);
    this.editor.on('viewport-change', handleViewportChange);

    // Listen for other users' presence
    const presenceRef = ref(database, `rooms/${this.roomId}/presence`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val();
      console.log('Received presence update:', presence);
      if (presence) {
        this.renderOtherUsers(presence);
      }
    });

    this.unsubscribers.push(unsubscribe);

    // Clean up presence when user leaves
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    console.log('Presence tracking setup complete');
  }

  private updatePresence(cursor?: { x: number; y: number }) {
    if (!this.editor || !this.presenceRef) return;

    try {
      const viewport = this.editor.getViewportPageBounds();
      const zoom = this.editor.getZoomLevel();

      const presence: UserPresence = {
        id: this.userId,
        name: this.userName,
        color: this.userColor,
        cursor: cursor || null,
        viewport: viewport ? {
          x: viewport.x,
          y: viewport.y,
          z: zoom
        } : null,
        lastActivity: serverTimestamp()
      };

      set(this.presenceRef, presence).then(() => {
        // Success - no need to log every cursor update
        if (!cursor) {
          console.log('✅ User presence updated successfully');
        }
      }).catch((error) => {
        console.error('❌ Failed to update presence:', error);
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  private renderOtherUsers(presence: Record<string, UserPresence>) {
    // Clear existing user indicators
    const existingIndicators = document.querySelectorAll('.user-presence-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Render presence indicators for other users
    Object.entries(presence).forEach(([userId, user]) => {
      if (userId !== this.userId && user.cursor && user.lastActivity) {
        console.log(`Rendering presence for user ${user.name}:`, user);
        this.renderUserCursor(user);
      }
    });
  }
  
  private renderUserCursor(user: UserPresence) {
    if (!this.editor || !user.cursor) return;
    
    try {
      // Convert page coordinates to screen coordinates
      const screenPoint = this.editor.pageToScreen(user.cursor.x, user.cursor.y);
      
      // Create or update cursor element
      let cursorElement = document.getElementById(`cursor-${user.id}`);
      if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.id = `cursor-${user.id}`;
        cursorElement.className = 'user-presence-indicator';
        cursorElement.style.cssText = `
          position: fixed;
          pointer-events: none;
          z-index: 1000;
          transition: all 0.1s ease;
        `;
        
        cursorElement.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background: ${user.color};
            border: 2px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          "></div>
          <div style="
            position: absolute;
            top: 25px;
            left: 0;
            background: ${user.color};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">${user.name}</div>
        `;
        
        document.body.appendChild(cursorElement);
      }
      
      // Update cursor position
      cursorElement.style.left = `${screenPoint.x}px`;
      cursorElement.style.top = `${screenPoint.y}px`;
      
    } catch (error) {
      console.error('Error rendering user cursor:', error);
    }
  }

  public async addVoiceAnnotation(position: { x: number; y: number }, audioBlob: Blob): Promise<string> {
    // Upload audio to R2 storage (we'll implement this)
    const audioUrl = await this.uploadAudioToR2(audioBlob);
    
    const annotation: Omit<VoiceAnnotation, 'id'> = {
      userId: this.userId,
      userName: this.userName,
      position,
      audioUrl,
      timestamp: serverTimestamp()
    };

    const annotationsRef = ref(database, `rooms/${this.roomId}/annotations`);
    const newAnnotationRef = push(annotationsRef);
    await set(newAnnotationRef, annotation);

    return newAnnotationRef.key!;
  }

  private async uploadAudioToR2(audioBlob: Blob): Promise<string> {
    // Create form data for upload
    const formData = new FormData();
    formData.append('audio', audioBlob, `annotation_${Date.now()}.webm`);
    formData.append('roomId', this.roomId);

    try {
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  public listenToVoiceAnnotations(callback: (annotations: VoiceAnnotation[]) => void) {
    const annotationsRef = ref(database, `rooms/${this.roomId}/annotations`);
    
    const unsubscribe = onValue(annotationsRef, (snapshot) => {
      const annotations = snapshot.val();
      if (annotations) {
        const annotationsList = Object.entries(annotations).map(([id, annotation]: [string, any]) => ({
          id,
          ...annotation
        }));
        callback(annotationsList);
      }
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  public cleanup() {
    console.log('Cleaning up collaboration service for user:', this.userId);
    
    // Remove presence
    if (this.presenceRef) {
      remove(this.presenceRef);
    }
    
    // Remove user cursor indicators
    const userIndicators = document.querySelectorAll('.user-presence-indicator');
    userIndicators.forEach(indicator => indicator.remove());

    // Unsubscribe from all listeners
    this.unsubscribers.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    this.unsubscribers = [];
  }
}

export default CollaborationService;
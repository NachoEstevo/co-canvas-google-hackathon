'use client'

import { Tldraw } from 'tldraw'
import type { TldrawEditor } from '@tldraw/tldraw'
import { useEffect, useState } from 'react'
import { GenerationOverlay } from '../GenerationUI/GenerationOverlay'
import { UserPresenceOverlay } from '../Collaboration/UserPresenceOverlay'
import { VoiceAnnotationsOverlay } from '../Collaboration/VoiceAnnotationsOverlay'
import { CollaborationService, VoiceAnnotation } from '../../lib/collaboration'

interface CollaborativeCanvasProps {
  roomId: string
  onEditorMount?: (editor: any) => void
}

export function CollaborativeCanvas({ roomId, onEditorMount }: CollaborativeCanvasProps) {
  const [editor, setEditor] = useState<any>(null)
  const [collaborationService, setCollaborationService] = useState<CollaborationService | null>(null)
  const [voiceAnnotations, setVoiceAnnotations] = useState<VoiceAnnotation[]>([])
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    try {
      // Initialize collaboration service
      const service = new CollaborationService(roomId)
      setCollaborationService(service)

      // Listen for voice annotations
      service.listenToVoiceAnnotations(setVoiceAnnotations)

      return () => {
        service.cleanup()
      }
    } catch (error) {
      console.error('Failed to initialize collaboration service:', error)
      setHasError(true)
    }
  }, [roomId])

  const handleMount = (editor: any) => {
    setEditor(editor)
    console.log('TLDRAW Editor mounted for room:', roomId)
    console.log('Editor instance:', editor)
    
    // Set up collaboration
    if (collaborationService) {
      collaborationService.setEditor(editor)
    }
    
    // Call parent callback
    if (onEditorMount) {
      onEditorMount(editor)
    }
    
    // Set up some default preferences for better UX
    editor.user.updateUserPreferences({
      isSnapMode: false,
    })
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Canvas Error</h3>
          <p className="text-gray-600 mb-4">Failed to initialize the collaborative canvas.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tldraw-container" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <Tldraw 
        onMount={handleMount}
        persistenceKey={`co-creative-canvas-${roomId}`}
      />
      
      {/* Custom UI Overlays - positioned above TLDRAW */}
      {editor && (
        <div className="generation-overlay">
          <GenerationOverlay editor={editor} />
        </div>
      )}
      
      {editor && collaborationService && (
        <div className="user-presence-overlay" style={{ position: 'fixed', top: '20px', left: '20px' }}>
          <UserPresenceOverlay 
            editor={editor} 
            collaborationService={collaborationService}
          />
        </div>
      )}
      
      {editor && collaborationService && (
        <VoiceAnnotationsOverlay
          editor={editor}
          collaborationService={collaborationService}
          annotations={voiceAnnotations}
        />
      )}
    </div>
  )
}
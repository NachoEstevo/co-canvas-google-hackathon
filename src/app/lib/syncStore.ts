import { createTLStore, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import { customAssetStore } from './assetStore'
import { database } from './firebase'
import { ref, onValue, set, serverTimestamp } from 'firebase/database'
import { useEffect, useMemo, useState } from 'react'

// Custom sync using Firebase with full asset support
export function useFirebaseSync({ roomId }: { roomId: string }) {
  const [isConnected, setIsConnected] = useState(false)
  
  // Create store with asset support
  const store = useMemo(() => {
    console.log('🔗 Creating store with Firebase sync and R2 assets for room:', roomId)
    return createTLStore({
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
      assets: customAssetStore, // This enables proper image uploads!
    })
  }, [roomId])
  
  useEffect(() => {
    if (!store || !roomId) return
    
    const roomRef = ref(database, `tldraw-rooms/${roomId}/document`)
    let isInitialized = false
    let isSyncing = false
    
    // Listen for remote changes
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const remoteData = snapshot.val()
      
      if (remoteData && remoteData.document) {
        // Don't sync our own changes back
        if (remoteData.lastUpdatedBy === store.id) {
          console.log('📭 Ignoring own changes from Firebase')
          return
        }
        
        // Prevent sync loops
        if (isSyncing) {
          console.log('🔄 Already syncing, skipping...')
          return
        }
        
        try {
          isSyncing = true
          console.log('📥 Loading remote changes from Firebase', {
            from: remoteData.lastUpdatedBy,
            timestamp: remoteData.timestamp
          })
          
          // Load the remote document state
          store.loadSnapshot(remoteData.document)
          setIsConnected(true)
          isInitialized = true
          
        } catch (error) {
          console.error('❌ Failed to sync remote changes:', error)
          setIsConnected(false)
        } finally {
          isSyncing = false
        }
      } else if (!isInitialized) {
        // First time - no remote data, mark as connected
        setIsConnected(true)
        isInitialized = true
        console.log('🆕 No remote data found, starting fresh')
      }
    })
    
    // Save local changes to Firebase with debouncing
    let saveTimeout: NodeJS.Timeout
    let lastSaveTime = 0
    
    const handleStoreChange = () => {
      // Don't save while we're syncing from remote
      if (isSyncing) return
      
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        const now = Date.now()
        // Prevent rapid saves
        if (now - lastSaveTime < 200) return
        
        try {
          const snapshot = store.getSnapshot()
          console.log('📤 Saving local changes to Firebase')
          
          set(roomRef, {
            document: snapshot,
            lastUpdatedBy: store.id,
            timestamp: serverTimestamp(),
            updatedAt: now
          }).then(() => {
            console.log('✅ Document saved to Firebase successfully')
            setIsConnected(true)
            lastSaveTime = now
          }).catch((error) => {
            console.error('❌ Failed to save to Firebase:', error)
            setIsConnected(false)
          })
        } catch (error) {
          console.error('❌ Error preparing document for save:', error)
        }
      }, 500) // Increased debounce to 500ms for stability
    }
    
    // Subscribe to store changes
    const dispose = store.listen(handleStoreChange, { source: 'user' })
    
    console.log('✅ Firebase sync initialized with asset support for room:', roomId)
    
    return () => {
      clearTimeout(saveTimeout)
      dispose()
      unsubscribe()
      console.log('🧹 Firebase sync cleanup for room:', roomId)
    }
  }, [store, roomId])
  
  return { store, isConnected }
}
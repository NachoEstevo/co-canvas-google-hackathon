'use client'

import { Tldraw } from 'tldraw'
import { useSync } from '@tldraw/sync'
import type { TldrawEditor } from 'tldraw'
import { useEffect, useState } from 'react'
import { GenerationOverlay } from '../GenerationUI/GenerationOverlay'
import { VoiceRecordingButton } from './VoiceRecordingButton'
import { customAssetStore } from '../../lib/assetStore'

interface CollaborativeCanvasProps {
  roomId: string
  userName?: string
  onEditorMount?: (editor: any) => void
}

export function CollaborativeCanvas({ roomId, userName, onEditorMount }: CollaborativeCanvasProps) {
  const [editor, setEditor] = useState<any>(null)
  const [hasError, setHasError] = useState(false)
  
  // Determine WebSocket URL based on environment
  const getWebSocketUrl = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/sync?roomId=${roomId}`
      console.log('🔌 WebSocket URL:', wsUrl)
      return wsUrl
    }
    return `ws://localhost:3000/api/sync?roomId=${roomId}`
  }
  
  // Use production sync with our custom WebSocket server
  const store = useSync({
    uri: getWebSocketUrl(),
    assets: customAssetStore,
  })

  // Debug sync connection state
  useEffect(() => {
    if (store) {
      console.log('📦 Store created:', !!store)
      
      // Check if store is ready
      const checkStoreReady = () => {
        console.log('🔍 Store state check:', {
          hasStore: !!store,
          storeReady: store ? 'store exists' : 'no store'
        })
      }
      
      checkStoreReady()
      
      // Set up periodic checks
      const interval = setInterval(checkStoreReady, 2000)
      
      return () => clearInterval(interval)
    } else {
      console.log('❌ No store created')
      setHasError(true)
    }
  }, [store])
  

  const handleMount = (editor: any) => {
    
    setEditor(editor)
    
    // Call parent callback
    if (onEditorMount) {
      onEditorMount(editor)
    }
    
    // Set user name and preferences
    if (userName) {
      editor.user.updateUserPreferences({
        name: userName,
        isSnapMode: false,
      })
    }
    
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
    <div className="tldraw-container">
      <Tldraw 
        store={store}
        onMount={handleMount}
      />
      
      {/* Custom UI Overlays - positioned above TLDRAW */}
      {editor && (
        <div className="generation-overlay">
          <GenerationOverlay editor={editor} />
        </div>
      )}
      
      {/* Voice Recording Button */}
      {editor && (
        <VoiceRecordingButton editor={editor} roomId={roomId} />
      )}
      
      {/* Note: User presence is now handled natively by tldraw sync */}
    </div>
  )
}
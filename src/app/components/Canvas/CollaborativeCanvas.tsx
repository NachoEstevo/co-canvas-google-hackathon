'use client'

import { Tldraw, createTLStore, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import type { TldrawEditor } from 'tldraw'
import { useEffect, useState, useMemo } from 'react'
import { GenerationOverlay } from '../GenerationUI/GenerationOverlay'
import { VoiceRecordingButton } from './VoiceRecordingButton'
import { customAssetStore } from '../../lib/assetStore'

interface CollaborativeCanvasProps {
  roomId: string
  onEditorMount?: (editor: any) => void
}

export function CollaborativeCanvas({ roomId, onEditorMount }: CollaborativeCanvasProps) {
  const [editor, setEditor] = useState<any>(null)
  const [hasError, setHasError] = useState(false)
  
  // Create store only once using useMemo to prevent re-rendering loop
  const store = useMemo(() => {
    console.log('📋 Creating canvas store for room:', roomId)
    return createTLStore({
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
    })
  }, [roomId]) // Only recreate if roomId changes

  const handleMount = (editor: any) => {
    setEditor(editor)
    console.log('✅ Canvas ready with custom image upload handling')
    
    // Set up custom image upload handling
    setupCustomImageHandling(editor)
    
    // Call parent callback
    if (onEditorMount) {
      onEditorMount(editor)
    }
    
    // Set up some default preferences for better UX
    editor.user.updateUserPreferences({
      isSnapMode: false,
    })
  }

  const setupCustomImageHandling = (editor: any) => {
    // Handle file drops and pastes
    const handleFileUpload = async (file: File) => {
      if (!file.type.startsWith('image/')) return

      try {
        console.log('📁 Handling image upload:', file.name)
        
        // Upload to R2 via our API
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload/asset', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Image uploaded successfully:', result.src)

        // Create an image shape with the uploaded URL
        const viewport = editor.getViewportPageBounds()
        const center = { x: viewport.x + viewport.w / 2, y: viewport.y + viewport.h / 2 }
        
        editor.createShape({
          type: 'image',
          x: center.x - 100,
          y: center.y - 100,
          props: {
            url: result.src,
            w: 200,
            h: 200,
          }
        })

      } catch (error) {
        console.error('❌ Image upload failed:', error)
      }
    }

    // Set up drop handler
    const canvas = document.querySelector('.tldraw-container')
    if (canvas) {
      canvas.addEventListener('drop', (e: Event) => {
        e.preventDefault()
        const dragEvent = e as DragEvent
        const files = Array.from(dragEvent.dataTransfer?.files || [])
        files.forEach(handleFileUpload)
      })

      canvas.addEventListener('dragover', (e: Event) => {
        e.preventDefault()
      })
    }

    // Set up paste handler  
    document.addEventListener('paste', (e: Event) => {
      const clipboardEvent = e as ClipboardEvent
      const files = Array.from(clipboardEvent.clipboardData?.files || [])
      files.forEach(handleFileUpload)
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
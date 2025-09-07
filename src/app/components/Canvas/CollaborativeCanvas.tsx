'use client'

import { Tldraw, createTLStore, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
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
  
  // Use sync store for real-time collaboration
  const syncStore = useSyncDemo({ roomId })
  
  // Create fallback local store in case sync fails
  const localStore = useMemo(() => {
    return createTLStore({
      shapeUtils: defaultShapeUtils,
      bindingUtils: defaultBindingUtils,
    })
  }, [roomId])
  
  // Prefer sync store for collaboration, fallback to local
  const store = syncStore || localStore
  
  console.log('📋 Canvas initialized:', {
    roomId,
    hasSync: !!syncStore,
    hasStore: !!store
  })

  const handleMount = (editor: any) => {
    setEditor(editor)
    if (syncStore) {
      console.log('✅ Real-time collaboration active with custom image uploads')
    } else {
      console.log('⚠️ Using local store - collaboration not available, but image uploads work')
    }
    
    // Set up custom image upload handling with cleanup
    let cleanup: (() => void) | undefined
    
    // Small delay to ensure editor is fully mounted
    setTimeout(() => {
      cleanup = setupCustomImageHandling(editor)
    }, 100)
    
    // Call parent callback
    if (onEditorMount) {
      onEditorMount(editor)
    }
    
    // Set up some default preferences for better UX
    editor.user.updateUserPreferences({
      isSnapMode: false,
    })
    
    // Cleanup on unmount
    return () => {
      cleanup?.()
    }
  }

  const setupCustomImageHandling = (editor: any) => {
    // Handle file drops and pastes with enhanced logic
    const handleFileUpload = async (file: File) => {
      if (!file.type.startsWith('image/')) return

      try {
        console.log('📁 Processing image upload:', file.name)
        
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
        console.log('✅ Image uploaded to R2:', result.src)

        // Create asset first, then create image shape
        const assetId = editor.createAssetId()
        
        // Create asset record  
        const asset = {
          id: assetId,
          type: 'image' as const,
          typeName: 'asset' as const,
          props: {
            name: file.name,
            src: result.src,
            w: 200,
            h: 200,
            mimeType: file.type,
            isAnimated: false,
          },
          meta: {},
        }
        
        // Add asset to store
        editor.createAssets([asset])
        
        // Create image shape using the asset
        const viewport = editor.getViewportPageBounds()
        const center = { x: viewport.x + viewport.w / 2, y: viewport.y + viewport.h / 2 }
        
        const shapeId = editor.createShapeId()
        const imageShape = {
          id: shapeId,
          type: 'image' as const,
          typeName: 'shape' as const,
          x: center.x - 100,
          y: center.y - 100,
          rotation: 0,
          index: editor.getHighestIndexForParent(editor.getCurrentPageId()),
          parentId: editor.getCurrentPageId(),
          props: {
            assetId: assetId,
            w: 200,
            h: 200,
          },
          meta: {},
          opacity: 1,
          isLocked: false,
        }
        
        editor.createShapes([imageShape])
        console.log('✅ Image shape created successfully')

      } catch (error) {
        console.error('❌ Image upload failed:', error)
        // Show user-friendly error
        alert('Failed to upload image. Please try again.')
      }
    }

    // Enhanced drop handler with better event handling
    const setupDropHandler = () => {
      const container = document.querySelector('.tldraw-container')
      if (!container) return

      const handleDrop = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        
        const dragEvent = e as DragEvent
        if (!dragEvent.dataTransfer) return
        
        const files = Array.from(dragEvent.dataTransfer.files)
        const imageFiles = files.filter(f => f.type.startsWith('image/'))
        
        console.log(`📥 Dropped ${imageFiles.length} images`)
        imageFiles.forEach(handleFileUpload)
      }

      const handleDragOver = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      const handleDragEnter = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      container.addEventListener('drop', handleDrop)
      container.addEventListener('dragover', handleDragOver)  
      container.addEventListener('dragenter', handleDragEnter)

      return () => {
        container.removeEventListener('drop', handleDrop)
        container.removeEventListener('dragover', handleDragOver)
        container.removeEventListener('dragenter', handleDragEnter)
      }
    }

    // Enhanced paste handler
    const setupPasteHandler = () => {
      const handlePaste = (e: Event) => {
        const clipboardEvent = e as ClipboardEvent
        if (!clipboardEvent.clipboardData) return
        
        const files = Array.from(clipboardEvent.clipboardData.files)
        const imageFiles = files.filter(f => f.type.startsWith('image/'))
        
        if (imageFiles.length > 0) {
          e.preventDefault()
          e.stopPropagation()
          console.log(`📋 Pasted ${imageFiles.length} images`)
          imageFiles.forEach(handleFileUpload)
        }
      }

      document.addEventListener('paste', handlePaste)
      
      return () => {
        document.removeEventListener('paste', handlePaste)
      }
    }

    // Setup handlers and return cleanup function
    const cleanupDrop = setupDropHandler()
    const cleanupPaste = setupPasteHandler()
    
    return () => {
      cleanupDrop?.()
      cleanupPaste?.()
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
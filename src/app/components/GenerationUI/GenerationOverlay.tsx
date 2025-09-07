'use client'

import { TldrawEditor, createShapeId, TLImageAsset } from 'tldraw'
import { useState, useEffect } from 'react'
import { VoicePromptInput } from '../VoicePrompt/VoicePromptInput'
import { AIButton } from '../UI/AIButton'

interface GenerationOverlayProps {
  editor: any
}

export function GenerationOverlay({ editor }: GenerationOverlayProps) {
  const [selectedShapes, setSelectedShapes] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUI, setShowUI] = useState(false)
  const [generationMode, setGenerationMode] = useState<'transform' | 'fusion' | 'fromScratch' | 'enhance'>('transform')

  useEffect(() => {
    if (!editor) return

    const updateSelection = () => {
      const selected = editor.getSelectedShapeIds()
      setSelectedShapes(selected)
      // Don't auto-show UI anymore - only show when AI button is clicked
    }

    // Listen to selection changes
    editor.on('change', updateSelection)
    updateSelection()

    return () => {
      editor.off('change', updateSelection)
    }
  }, [editor])

  const toggleAIDialog = () => {
    setShowUI(!showUI)
    // Set default mode based on selection
    if (selectedShapes.length === 0) {
      setGenerationMode('fromScratch')
    } else if (selectedShapes.length >= 2) {
      setGenerationMode('fusion')
    } else {
      setGenerationMode('transform')
    }
  }

  const getBestBoundsForShapes = (shapeIds: string[]) => {
    try {
      // Try to get selection bounds first
      const selectionBounds = editor.getSelectionPageBounds()
      if (selectionBounds) {
        return selectionBounds
      }
      
      // Fall back to calculating bounds from individual shapes
      const shapes = shapeIds.map(id => editor.getShape(id)).filter(Boolean)
      if (shapes.length === 0) {
        return { x: 100, y: 100, w: 400, h: 400 } // Default bounds
      }
      
      // Calculate combined bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      for (const shape of shapes) {
        if (shape.x !== undefined && shape.y !== undefined) {
          minX = Math.min(minX, shape.x)
          minY = Math.min(minY, shape.y)
          maxX = Math.max(maxX, shape.x + (shape.props?.w || 100))
          maxY = Math.max(maxY, shape.y + (shape.props?.h || 100))
        }
      }
      
      return {
        x: isFinite(minX) ? minX : 100,
        y: isFinite(minY) ? minY : 100,
        w: isFinite(maxX - minX) ? maxX - minX : 400,
        h: isFinite(maxY - minY) ? maxY - minY : 400
      }
    } catch (error) {
      console.error('Error calculating bounds:', error)
      return { x: 100, y: 100, w: 400, h: 400 }
    }
  }
  
  const placeImageOnCanvas = async (imageUrl: string, bounds: any) => {
    try {
      console.log('Placing image on canvas:', { imageUrl: imageUrl.substring(0, 50) + '...', bounds })
      
      // Create an image asset from the URL/data
      const assetId = `asset:${Math.random().toString(36).substr(2, 9)}` as any
      
      // Create the asset
      const asset: TLImageAsset = {
        id: assetId,
        type: 'image',
        typeName: 'asset',
        props: {
          name: 'generated-image.png',
          src: imageUrl,
          w: 512,
          h: 512,
          mimeType: imageUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
          isAnimated: false,
        },
        meta: {}
      }
      
      // Add the asset to the editor
      editor.createAssets([asset])
      
      // Create a shape that uses this asset
      const shapeId = createShapeId()
      const shape = {
        id: shapeId,
        type: 'image',
        x: bounds.x,
        y: bounds.y,
        props: {
          assetId: assetId,
          w: 400,
          h: 400,
        }
      }
      
      // Add the shape to the canvas
      editor.createShape(shape)
      
      // Select the new image
      editor.setSelectedShapes([shapeId])
      
      console.log('Image placed successfully on canvas')
      
      // Show a subtle notification instead of alert
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: opacity 0.3s ease;
      `
      notification.textContent = '✨ AI content generated'
      document.body.appendChild(notification)
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0'
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 300)
      }, 3000)
      
    } catch (error) {
      console.error('Error placing image on canvas:', error)
      throw error
    }
  }

  const handleGenerate = async () => {
    if (!editor || selectedShapes.length === 0 || !prompt.trim()) return

    setIsGenerating(true)
    try {
      // Get selected shapes and analyze their types
      const shapes = selectedShapes.map(id => editor.getShape(id)).filter(Boolean)
      const imageShapes = shapes.filter(shape => shape.type === 'image')
      const otherShapes = shapes.filter(shape => shape.type !== 'image')
      
      console.log('Selected shapes analysis:', {
        total: shapes.length,
        images: imageShapes.length,
        drawings: otherShapes.length
      })
      
      // Enhance the prompt based on generation mode and context
      let contextualPrompt = await enhancePromptWithMode(prompt, generationMode, imageShapes, otherShapes)
      
      let requestData: any = { prompt: contextualPrompt }
      
      // Process images based on selection type
      console.log('Processing selection:', {
        imageShapes: imageShapes.length,
        otherShapes: otherShapes.length,
        total: shapes.length
      })
      
      // If we have uploaded images, include them in the context
      if (imageShapes.length > 0) {
        console.log('Processing uploaded images as context')
        requestData.images = []
        
        for (const shape of imageShapes) {
          const asset = editor.getAsset(shape.props.assetId)
          if (asset?.type === 'image') {
            const imageData = asset.props.src
            console.log('Processing image asset:', { 
              id: asset.id, 
              dataType: typeof imageData, 
              dataPreview: imageData?.substring(0, 50) + '...' 
            })
            
            if (imageData && typeof imageData === 'string') {
              if (imageData.startsWith('data:image/')) {
                // Extract base64 data from data URL
                const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
                if (matches) {
                  requestData.images.push({
                    mimeType: matches[1],
                    data: matches[2]
                  })
                } else {
                  // Handle other data URL formats
                  const mimeTypeMatch = imageData.match(/^data:([^;]+)/)
                  const base64Data = imageData.split(',')[1]
                  if (mimeTypeMatch && base64Data) {
                    requestData.images.push({
                      mimeType: mimeTypeMatch[1],
                      data: base64Data
                    })
                  }
                }
              } else if (imageData.startsWith('http')) {
                // Handle external URLs by converting to base64
                try {
                  const response = await fetch(imageData)
                  const blob = await response.blob()
                  const reader = new FileReader()
                  const base64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                      const result = reader.result as string
                      const base64Data = result.split(',')[1]
                      resolve(base64Data)
                    }
                    reader.readAsDataURL(blob)
                  })
                  requestData.images.push({
                    mimeType: blob.type || 'image/png',
                    data: base64
                  })
                } catch (error) {
                  console.warn('Failed to fetch external image:', imageData, error)
                }
              }
            }
          }
        }
        
        console.log('Processed images:', requestData.images.length)
      }
      
      // Always include drawn shapes as context (either as the main content or additional context)
      if (otherShapes.length > 0 || (shapes.length > 0 && requestData.images?.length === 0)) {
        console.log('Processing drawn shapes as main content')
        const selectionBounds = getBestBoundsForShapes(selectedShapes)
        
        console.log('Using bounds:', selectionBounds)

        try {
          const svgResult = await editor.getSvgString(selectedShapes, {
            bounds: selectionBounds,
            background: true,
          })
          
          // Extract the actual SVG string from the result
          const svgData = typeof svgResult === 'object' && svgResult?.svg ? svgResult.svg : svgResult
          
          if (!svgData || typeof svgData !== 'string') {
            throw new Error('Failed to generate SVG from selection')
          }
          
          console.log('Generated SVG data:', svgData.substring(0, 100) + '...')
          
          // Convert SVG to PNG since Gemini doesn't support SVG
          const pngDataUrl = await new Promise<string>((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()
            
            img.onload = () => {
              try {
                // Set canvas size based on image or default
                const width = img.naturalWidth || 512
                const height = img.naturalHeight || 512
                canvas.width = width
                canvas.height = height
                
                // Clear canvas with white background
                ctx!.fillStyle = 'white'
                ctx!.fillRect(0, 0, width, height)
                
                // Draw the image
                ctx!.drawImage(img, 0, 0)
                
                // Convert to PNG
                const dataUrl = canvas.toDataURL('image/png', 0.9)
                resolve(dataUrl)
              } catch (error) {
                reject(error)
              }
            }
            
            img.onerror = (error) => {
              console.error('Failed to load SVG image:', error)
              reject(new Error('Failed to load SVG for conversion'))
            }
            
            // Create blob URL from SVG
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)
            img.src = url
            
            // Clean up after a timeout
            setTimeout(() => {
              URL.revokeObjectURL(url)
            }, 5000)
          })
          
          requestData.imageData = pngDataUrl
          console.log('Successfully converted shapes to PNG')
          
        } catch (error) {
          console.error('Failed to process drawn shapes:', error)
          throw new Error('Failed to process your drawings. Please try selecting different shapes.')
        }
      }
      
      console.log('Sending request with:', {
        hasImageData: !!requestData.imageData,
        hasImages: !!requestData.images,
        imagesCount: requestData.images?.length || 0
      })

      // Send to Gemini API
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('Generated content:', result.content)
        console.log('Image URL:', result.imageUrl)
        
        // If we have an image, place it on the canvas
        if (result.imageUrl || result.imageData) {
          // Get placement bounds - use the original selection bounds or calculate new ones
          const placementBounds = getBestBoundsForShapes(selectedShapes)
          // Offset the new image slightly to avoid covering the original
          placementBounds.x += 50
          placementBounds.y += 50
          await placeImageOnCanvas(result.imageUrl || result.imageData, placementBounds)
        }
        
        // Log success silently - no alert needed
        const message = imageShapes.length > 0 ? 
          `AI generated new content based on your ${imageShapes.length} uploaded image${imageShapes.length > 1 ? 's' : ''} and drawings!` :
          `AI generated new content based on your drawings!`
        console.log(message)
        
        // Clear the prompt
        setPrompt('')
      } else {
        throw new Error(result.error || 'Generation failed')
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Generation failed: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper functions for enhanced generation modes
  const getModeDescription = (mode: string, shapeCount: number) => {
    switch (mode) {
      case 'transform':
        return `Transform your ${shapeCount} selected item${shapeCount > 1 ? 's' : ''}`
      case 'fusion':
        return `Fuse your ${shapeCount} selected items together`
      case 'fromScratch':
        return 'Create something completely new'
      case 'enhance':
        return `Enhance and improve your ${shapeCount} selected item${shapeCount > 1 ? 's' : ''}`
      default:
        return 'What do you want to create?'
    }
  }
  
  const getPlaceholderText = (mode: string) => {
    switch (mode) {
      case 'transform':
        return 'e.g., Make this a photorealistic wooden chair'
      case 'fusion':
        return 'e.g., Combine these into a futuristic cityscape'
      case 'fromScratch':
        return 'e.g., A majestic dragon flying over mountains'
      case 'enhance':
        return 'e.g., Add more detail and professional lighting'
      default:
        return 'Describe what you want to create...'
    }
  }
  
  const enhancePromptWithMode = async (userPrompt: string, mode: string, imageShapes: any[], otherShapes: any[]) => {
    const modeEnhancements = {
      transform: {
        prefix: 'Transform and modify the existing content:',
        suffix: 'Keep the core essence but apply the requested changes with high quality and detail.'
      },
      fusion: {
        prefix: 'Seamlessly fuse and blend multiple elements together:',
        suffix: 'Create a cohesive composition that combines all elements harmoniously with artistic flair.'
      },
      fromScratch: {
        prefix: 'Create a completely new image from scratch:',
        suffix: 'Generate with exceptional detail, composition, and artistic quality.'
      },
      enhance: {
        prefix: 'Enhance and improve the existing content:',
        suffix: 'Add professional lighting, textures, details, and visual polish while maintaining the original concept.'
      }
    }
    
    const enhancement = modeEnhancements[mode as keyof typeof modeEnhancements]
    let contextualPrompt = `${enhancement.prefix} ${userPrompt}. ${enhancement.suffix}`
    
    // Add context based on selection
    if (imageShapes.length > 0 && otherShapes.length > 0) {
      contextualPrompt += ` I have both uploaded images and drawn shapes selected. Use the uploaded images as reference and incorporate the drawings.`
    } else if (imageShapes.length > 0) {
      contextualPrompt += ` I have ${imageShapes.length} uploaded image${imageShapes.length > 1 ? 's' : ''} selected as source material.`
    } else if (otherShapes.length > 0) {
      contextualPrompt += ` I have drawn ${otherShapes.length} shape${otherShapes.length > 1 ? 's' : ''} on the canvas as source material.`
    }
    
    return contextualPrompt
  }

  return (
    <>
      {/* AI Button - Always visible */}
      <AIButton 
        onClick={toggleAIDialog}
        disabled={false}
      />

      {/* AI Generation Dialog - Only shows when AI button is clicked */}
      {showUI && selectedShapes.length > 0 && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-lg shadow-xl p-6 min-w-[400px] max-w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-md flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">AI Transform</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedShapes.length} shape{selectedShapes.length > 1 ? 's' : ''} selected
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowUI(false)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Generation Mode Selector */}
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-medium">
              Generation Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGenerationMode('transform')}
                disabled={selectedShapes.length === 0}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  generationMode === 'transform' && selectedShapes.length > 0
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${selectedShapes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🎨 Transform
              </button>
              <button
                onClick={() => setGenerationMode('fusion')}
                disabled={selectedShapes.length < 2}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  generationMode === 'fusion' && selectedShapes.length >= 2
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${selectedShapes.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🔗 Fuse
              </button>
              <button
                onClick={() => setGenerationMode('fromScratch')}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  generationMode === 'fromScratch'
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                ✨ Create New
              </button>
              <button
                onClick={() => setGenerationMode('enhance')}
                disabled={selectedShapes.length === 0}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  generationMode === 'enhance' && selectedShapes.length > 0
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${selectedShapes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                🚀 Enhance
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              {getModeDescription(generationMode, selectedShapes.length)}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getPlaceholderText(generationMode)}
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isGenerating}
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && prompt.trim() && handleGenerate()}
              />
              <VoicePromptInput 
                onTranscription={setPrompt}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              ✨ AI will analyze and transform your selection
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUI(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors disabled:pointer-events-none disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
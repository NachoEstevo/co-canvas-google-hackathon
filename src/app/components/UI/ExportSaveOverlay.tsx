'use client'

import { useState } from 'react'
import type { TldrawEditor } from 'tldraw'
import { useErrorHandler } from './NotificationSystem'

interface ExportSaveOverlayProps {
  editor: any
  roomId: string
}

export function ExportSaveOverlay({ editor, roomId }: ExportSaveOverlayProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const { handleError, handleSuccess, handleInfo } = useErrorHandler()

  const exportAsPNG = async () => {
    setIsExporting(true)
    try {
      const shapes = editor.getCurrentPageShapes()
      if (shapes.length === 0) {
        handleInfo('Canvas is empty - nothing to export')
        return
      }

      const svg = await editor.getSvgElement(shapes.map((shape: any) => shape.id))
      if (!svg) {
        throw new Error('Failed to generate SVG')
      }

      // Convert SVG to PNG using canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to create canvas context')

      const img = new Image()
      const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = img.width || 800
        canvas.height = img.height || 600
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `canvas-${roomId}-${Date.now()}.png`
            link.click()
            URL.revokeObjectURL(link.href)
            handleSuccess('Canvas exported as PNG')
          }
        }, 'image/png')
        
        URL.revokeObjectURL(url)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        throw new Error('Failed to load SVG image')
      }

      img.src = url
    } catch (error) {
      handleError(error instanceof Error ? error : 'Export failed')
    } finally {
      setIsExporting(false)
      setShowExportMenu(false)
    }
  }

  const exportAsSVG = async () => {
    setIsExporting(true)
    try {
      const shapes = editor.getCurrentPageShapes()
      if (shapes.length === 0) {
        handleInfo('Canvas is empty - nothing to export')
        return
      }

      const svg = await editor.getSvgElement(shapes.map((shape: any) => shape.id))
      if (!svg) {
        throw new Error('Failed to generate SVG')
      }

      const svgString = svg.outerHTML
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `canvas-${roomId}-${Date.now()}.svg`
      link.click()
      URL.revokeObjectURL(link.href)
      
      handleSuccess('Canvas exported as SVG')
    } catch (error) {
      handleError(error instanceof Error ? error : 'Export failed')
    } finally {
      setIsExporting(false)
      setShowExportMenu(false)
    }
  }

  const exportAsJSON = async () => {
    setIsExporting(true)
    try {
      const snapshot = editor.getSnapshot()
      const dataString = JSON.stringify(snapshot, null, 2)
      const blob = new Blob([dataString], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `canvas-${roomId}-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      
      handleSuccess('Canvas data exported as JSON')
    } catch (error) {
      handleError(error instanceof Error ? error : 'Export failed')
    } finally {
      setIsExporting(false)
      setShowExportMenu(false)
    }
  }

  const saveToCloud = async () => {
    setIsSaving(true)
    try {
      const snapshot = editor.getSnapshot()
      const response = await fetch('/api/canvas/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          snapshot,
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }

      const result = await response.json()
      handleSuccess(`Canvas saved to cloud (${result.id})`)
    } catch (error) {
      handleError(error instanceof Error ? error : 'Save to cloud failed')
    } finally {
      setIsSaving(false)
    }
  }

  const loadFromFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          editor.loadSnapshot(data)
          handleSuccess('Canvas loaded from file')
        } catch (error) {
          handleError('Invalid file format')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Save to Cloud Button */}
      <button
        onClick={saveToCloud}
        disabled={isSaving}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
          border border-input shadow-sm transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${isSaving 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }
        `}
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
              <path d="M5 15a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
            </svg>
            <span>Save</span>
          </>
        )}
      </button>

      {/* Export Menu */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={isExporting}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            border border-input shadow-sm transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            ${isExporting 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-violet-600 text-white hover:bg-violet-700'
            }
          `}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>

        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-[100]">
            <button
              onClick={exportAsPNG}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span>Export as PNG</span>
            </button>
            <button
              onClick={exportAsSVG}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Export as SVG</span>
            </button>
            <button
              onClick={exportAsJSON}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Export as JSON</span>
            </button>
            <hr className="my-1" />
            <button
              onClick={loadFromFile}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span>Load from File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
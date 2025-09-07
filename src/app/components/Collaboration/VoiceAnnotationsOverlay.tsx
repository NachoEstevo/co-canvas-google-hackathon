'use client'

import { useState, useRef, useEffect } from 'react'
import type { TldrawEditor } from '@tldraw/tldraw'
import { CollaborationService, VoiceAnnotation } from '../../lib/collaboration'

interface VoiceAnnotationsOverlayProps {
  editor: any
  collaborationService: CollaborationService
  annotations: VoiceAnnotation[]
}

export function VoiceAnnotationsOverlay({ 
  editor, 
  collaborationService, 
  annotations 
}: VoiceAnnotationsOverlayProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingPosition, setRecordingPosition] = useState<{ x: number; y: number } | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Hide instructions on first canvas interaction
    const handleFirstClick = () => {
      setShowInstructions(false)
    }
    
    const canvas = document.querySelector('.tldraw-container')
    if (canvas) {
      canvas.addEventListener('click', handleFirstClick, { once: true })
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleFirstClick)
      }
    }
  }, [])

  const startRecording = async (position: { x: number; y: number }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Add timeout to prevent infinite recording
      const recordingTimeout = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 30000) // 30 second max recording
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        clearTimeout(recordingTimeout)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        try {
          await collaborationService.addVoiceAnnotation(position, audioBlob)
        } catch (error) {
          console.error('Failed to save voice annotation:', error)
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
        setRecordingPosition(null)
      }
      
      mediaRecorder.onerror = (event) => {
        clearTimeout(recordingTimeout)
        console.error('MediaRecorder error:', event)
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
        setRecordingPosition(null)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingPosition(position)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
      setRecordingPosition(null)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (isRecording) {
      stopRecording()
      return
    }

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const pagePosition = editor.screenToPage(screenX, screenY)
    
    startRecording(pagePosition)
  }

  const playAnnotation = async (annotation: VoiceAnnotation) => {
    try {
      const audio = new Audio(annotation.audioUrl)
      audio.play()
    } catch (error) {
      console.error('Failed to play audio annotation:', error)
    }
  }

  return (
    <>
      {/* Recording overlay */}
      {isRecording && (
        <div 
          className="ui-overlay inset-0"
          onDoubleClick={handleCanvasDoubleClick}
        >
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Recording... Double-click to stop</span>
            </div>
          </div>
        </div>
      )}

      {/* Voice annotation button */}
      <div className="fixed bottom-8 right-8 z-[999]">
        <button
          onClick={(e) => {
            const rect = editor.getViewportPageBounds()
            const centerX = rect.x + rect.w / 2
            const centerY = rect.y + rect.h / 2
            startRecording({ x: centerX, y: centerY })
          }}
          disabled={isRecording}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            border border-input shadow-sm transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            disabled:pointer-events-none disabled:opacity-50
            ${isRecording 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isRecording ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Recording...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              <span>Voice Note</span>
            </>
          )}
        </button>
      </div>

      {/* Render voice annotations on canvas */}
      {annotations.map((annotation) => {
        const screenPoint = editor.pageToScreen(annotation.position.x, annotation.position.y)
        
        return (
          <div
            key={annotation.id}
            className="ui-overlay"
            style={{
              left: screenPoint.x,
              top: screenPoint.y,
              transform: 'translate(-12px, -12px)'
            }}
          >
            <button
              onClick={() => playAnnotation(annotation)}
              className="w-6 h-6 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              title={`Voice note by ${annotation.userName}`}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Annotation tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              {annotation.userName}
            </div>
          </div>
        )
      })}

      {/* Instructions overlay */}
      {!isRecording && annotations.length === 0 && showInstructions && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[998] pointer-events-none">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-xl shadow-md animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Double-click anywhere to add a voice annotation</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
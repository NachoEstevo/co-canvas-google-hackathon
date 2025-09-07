'use client'

import { useState, useRef } from 'react'
import { createShapeId } from '@tldraw/tldraw'

interface VoiceRecordingButtonProps {
  editor: any
  roomId: string
}

export function VoiceRecordingButton({ editor, roomId }: VoiceRecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
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
          // Create audio URL and add as voice note shape on canvas
          const audioUrl = URL.createObjectURL(audioBlob)
          
          // Get current viewport center for placement
          const viewport = editor.getViewportPageBounds()
          const centerX = viewport.x + viewport.w / 2
          const centerY = viewport.y + viewport.h / 2
          
          // Create a custom voice note shape
          const shapeId = createShapeId()
          const voiceNoteShape = {
            id: shapeId,
            type: 'note',
            x: centerX - 50,
            y: centerY - 25,
            props: {
              text: '🎤 Voice Note',
              audioUrl: audioUrl,
              size: 'm',
              color: 'violet',
              font: 'draw'
            }
          }
          
          // Add the voice note to canvas
          editor.createShape(voiceNoteShape)
          editor.setSelectedShapes([shapeId])
          
          console.log('🎤 Voice note added to canvas at:', { x: centerX, y: centerY })
          
        } catch (error) {
          console.error('Failed to create voice note:', error)
          // Fallback: just play the audio
          try {
            const audioUrl = URL.createObjectURL(audioBlob)
            const audio = new Audio(audioUrl)
            audio.play()
          } catch (playError) {
            console.error('Failed to play back voice note:', playError)
          }
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }
      
      mediaRecorder.onerror = (event) => {
        clearTimeout(recordingTimeout)
        console.error('MediaRecorder error:', event)
        stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied or not available')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
          border border-input shadow-sm transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          disabled:pointer-events-none disabled:opacity-50
          ${isRecording 
            ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
            : 'bg-purple-600 text-white hover:bg-purple-700'
          }
        `}
        title={isRecording ? 'Click to stop recording' : 'Click to start voice recording'}
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
  )
}
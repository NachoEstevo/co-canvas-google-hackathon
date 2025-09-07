'use client'

import { useState } from 'react'

interface VoicePromptInputProps {
  onTranscription: (text: string) => void
  disabled?: boolean
}

export function VoicePromptInput({ onTranscription, disabled }: VoicePromptInputProps) {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceInput = async () => {
    if (disabled) return
    
    // If already listening, stop the recognition
    if (isListening) {
      setIsListening(false)
      return
    }
    
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    setIsListening(true)
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      // Add timeout to prevent infinite recording
      const timeout = setTimeout(() => {
        recognition.stop()
        setIsListening(false)
      }, 10000) // 10 second timeout
      
      recognition.onresult = (event: any) => {
        clearTimeout(timeout)
        const transcript = event.results[0][0].transcript
        onTranscription(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = (event: any) => {
        clearTimeout(timeout)
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognition.onend = () => {
        clearTimeout(timeout)
        setIsListening(false)
      }
      
      recognition.start()
    } catch (error) {
      console.error('Voice input failed:', error)
      setIsListening(false)
    }
  }

  return (
    <button
      onClick={handleVoiceInput}
      disabled={disabled || isListening}
      className={`rounded-full p-3 transition-colors duration-200 text-white ${
        isListening 
          ? 'animate-pulse bg-red-500 hover:bg-red-600' 
          : 'bg-blue-500 hover:bg-blue-600'
      }`}
      title={isListening ? 'Listening...' : 'Voice input'}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
      </svg>
    </button>
  )
}

// Type declarations for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
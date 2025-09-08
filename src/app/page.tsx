'use client'

import { CollaborativeCanvas } from './components/Canvas/CollaborativeCanvas'
import { OnboardingTutorial, QuickHelpButton } from './components/UI/OnboardingTutorial'
import { ExportSaveOverlay } from './components/UI/ExportSaveOverlay'
import { ImageUploadButton } from './components/UI/ImageUploadButton'
import { UserNameDialog } from './components/UI/UserNameDialog'
import { useNotifications } from './components/UI/NotificationSystem'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { TldrawEditor } from 'tldraw'

export default function HomePage() {
  const [roomId, setRoomId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [editor, setEditor] = useState<any>(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    // Get or generate room ID from URL
    const urlParams = new URLSearchParams(window.location.search)
    let currentRoomId = urlParams.get('room')
    
    if (!currentRoomId) {
      currentRoomId = uuidv4()
      // Update URL without refreshing
      const newUrl = `${window.location.pathname}?room=${currentRoomId}`
      window.history.replaceState({}, '', newUrl)
    }
    
    setRoomId(currentRoomId)
  }, [])

  const copyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`
    navigator.clipboard.writeText(url)
    addNotification({
      type: 'success',
      title: 'Link Copied!',
      message: 'Room invite link copied to clipboard',
      duration: 3000
    })
  }

  const handleEditorMount = (mountedEditor: any) => {
    setEditor(mountedEditor)
  }

  const handleImageUpload = async (file: File) => {
    // This will trigger tldraw's native image upload via our asset store
    if (!editor) return
    
    
    // Create a file input event to trigger tldraw's native handling
    const input = document.createElement('input')
    input.type = 'file'
    input.files = (() => {
      const dt = new DataTransfer()
      dt.items.add(file)
      return dt.files
    })()
    
    // Dispatch to tldraw canvas to trigger native upload
    const canvas = document.querySelector('.tldraw')
    if (canvas) {
      const event = new Event('change', { bubbles: true })
      input.dispatchEvent(event)
      
      // Manually trigger by simulating drop
      const dropEvent = new DragEvent('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          items: [{ kind: 'file', type: file.type, getAsFile: () => file }]
        }
      })
      canvas.dispatchEvent(dropEvent)
    }
    
    addNotification({
      type: 'success',
      title: 'Image Upload Started',
      message: `Processing ${file.name}...`,
      duration: 2000
    })
  }

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Co-Creative Canvas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* User Name Dialog */}
      <UserNameDialog onUserNameSet={setUserName} />
      
      {/* TLDRAW Canvas - Full Screen */}
      <CollaborativeCanvas 
        roomId={roomId} 
        userName={userName}
        onEditorMount={handleEditorMount} 
      />
      
      {/* Top Navigation Bar */}
      <div className="navbar">
        <div className="px-6 py-3 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Co-Creative Canvas</h1>
                  <p className="text-xs text-gray-500">Real-time AI Collaboration + Native Sync</p>
                </div>
              </div>

              {/* Room Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    Room: <code className="font-mono bg-blue-100 px-2 py-1 rounded-md text-blue-800">{roomId.slice(0, 8)}...</code>
                  </span>
                  {userName && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                      👤 {userName}
                    </span>
                  )}
                  <button 
                    onClick={copyRoomLink}
                    className="ml-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-200"
                    title="Copy invite link"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <QuickHelpButton />
              {editor && <ImageUploadButton onImageUpload={handleImageUpload} />}
              {editor && <ExportSaveOverlay editor={editor} roomId={roomId} />}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial editor={editor} />
    </div>
  )
}
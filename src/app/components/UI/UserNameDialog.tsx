'use client'

import { useState, useEffect } from 'react'

interface UserNameDialogProps {
  onUserNameSet: (name: string) => void
}

export function UserNameDialog({ onUserNameSet }: UserNameDialogProps) {
  const [userName, setUserName] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // Check if user name is already stored
    const storedName = localStorage.getItem('tldraw-user-name')
    if (storedName) {
      setIsOpen(false)
      onUserNameSet(storedName)
    }
  }, [onUserNameSet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim()) {
      localStorage.setItem('tldraw-user-name', userName.trim())
      onUserNameSet(userName.trim())
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Co-Creative Canvas!</h2>
        <p className="text-gray-600 mb-6">
          Enter your name to join the collaborative session. Your name will be displayed to other users.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your name..."
              autoFocus
              maxLength={30}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!userName.trim()}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                userName.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => {
                const randomName = `User ${Math.floor(Math.random() * 1000)}`
                setUserName(randomName)
                localStorage.setItem('tldraw-user-name', randomName)
                onUserNameSet(randomName)
                setIsOpen(false)
              }}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Random
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
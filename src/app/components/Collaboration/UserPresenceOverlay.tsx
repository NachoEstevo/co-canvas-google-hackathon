'use client'

import { useEffect, useState } from 'react'
import type { TldrawEditor } from '@tldraw/tldraw'
import { CollaborationService, UserPresence } from '../../lib/collaboration'

interface UserPresenceOverlayProps {
  editor: any
  collaborationService: CollaborationService
}

export function UserPresenceOverlay({ editor, collaborationService }: UserPresenceOverlayProps) {
  const [otherUsers, setOtherUsers] = useState<Record<string, UserPresence>>({})

  useEffect(() => {
    // Listen for presence updates
    // This would be implemented in the collaboration service
    // For now, we'll create a placeholder
    const interval = setInterval(() => {
      // Simulate other users for demo purposes
      // In production, this would come from Firebase
      setOtherUsers({
        // user1: {
        //   id: 'user1',
        //   name: 'Alice',
        //   color: '#FF6B6B',
        //   cursor: { x: 100, y: 100 },
        //   viewport: { x: 0, y: 0, z: 1 },
        //   lastActivity: Date.now()
        // }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [collaborationService])

  return (
    <div className="user-presence-overlay">
      {/* Active Users List */}
      <div className="absolute top-20 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl pointer-events-auto min-w-[200px] border border-gray-200/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Active Users</h3>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <div className="space-y-2">
          {Object.values(otherUsers).map((user) => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div 
                className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          ))}
          {Object.keys(otherUsers).length === 0 && (
            <div className="py-2 px-2">
              <p className="text-sm text-gray-500 font-medium">No other users online</p>
              <p className="text-xs text-gray-400 mt-1">Share the room link to collaborate</p>
            </div>
          )}
        </div>
      </div>

      {/* Render other users' cursors */}
      {Object.values(otherUsers).map((user) => {
        if (!user.cursor) return null
        
        const screenPoint = editor.pageToScreen(user.cursor.x, user.cursor.y)
        
        return (
          <div
            key={`cursor-${user.id}`}
            className="absolute pointer-events-none z-20"
            style={{
              left: screenPoint.x,
              top: screenPoint.y,
              transform: 'translate(-2px, -2px)'
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 2.5L14.5 11.5L10.5 12.5L8.5 16.5L5.5 2.5Z"
                fill={user.color}
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            
            {/* User name label */}
            <div
              className="absolute left-5 top-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
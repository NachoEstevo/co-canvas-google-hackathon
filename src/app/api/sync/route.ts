import { NextRequest } from 'next/server'
import { WebSocketServer, WebSocket } from 'ws'
import { TLSocketRoom } from '@tldraw/sync-core'
import { customAssetStore } from '../../lib/assetStore'

// Store active rooms
const rooms = new Map<string, TLSocketRoom<any>>()

// WebSocket server instance
let wss: WebSocketServer | null = null

function ensureWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ 
      port: parseInt(process.env.WS_PORT || '3001'),
      path: '/api/sync'
    })
    
    console.log('🔌 WebSocket server started on port', process.env.WS_PORT || '3001')
    
    wss.on('connection', (ws: WebSocket, request) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`)
      const roomId = url.searchParams.get('roomId')
      
      if (!roomId) {
        console.error('❌ No roomId provided')
        ws.close(1008, 'Room ID required')
        return
      }
      
      console.log(`👥 New connection to room: ${roomId}`)
      
      // Get or create room
      let room = rooms.get(roomId)
      if (!room) {
        console.log(`🏠 Creating new room: ${roomId}`)
        room = new TLSocketRoom({
          initialSnapshot: null,
          onSessionRemoved: (room, args) => {
            console.log(`👋 Session removed from room ${roomId}:`, args.sessionId)
            if (room.getNumActiveSessions() === 0) {
              console.log(`🗑️ Room ${roomId} is empty, cleaning up`)
              rooms.delete(roomId)
            }
          },
          onDataChange: () => {
            // Optional: Save room state to persistent storage
            console.log(`💾 Room ${roomId} data changed`)
          }
        })
        rooms.set(roomId, room)
      }
      
      // Handle WebSocket connection
      room.handleSocketConnect(ws)
      
      ws.on('close', () => {
        console.log(`🔌 Connection closed for room: ${roomId}`)
      })
      
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error in room ${roomId}:`, error)
      })
    })
    
    wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error)
    })
  }
  
  return wss
}

// Initialize WebSocket server
if (process.env.NODE_ENV !== 'development') {
  ensureWebSocketServer()
}

export async function GET(request: NextRequest) {
  // For Railway deployment, we need to handle WebSocket upgrade
  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('roomId')
  
  if (!roomId) {
    return new Response('Room ID required', { status: 400 })
  }
  
  // In production, WebSocket connections are handled by the server
  // This endpoint is for health checks
  return new Response(JSON.stringify({ 
    status: 'WebSocket server ready',
    roomId,
    activeRooms: rooms.size,
    port: process.env.WS_PORT || '3001'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
const { WebSocketServer } = require('ws')
const { TLSocketRoom } = require('@tldraw/sync-core')
const { createServer } = require('http')
const url = require('url')

// Store active rooms
const rooms = new Map()

// Create HTTP server for Railway
const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      activeRooms: rooms.size,
      timestamp: new Date().toISOString()
    }))
    return
  }
  
  res.writeHead(404)
  res.end('Not Found')
})

// Create WebSocket server
const wss = new WebSocketServer({ server })

console.log('🚀 Starting tldraw sync server...')

wss.on('connection', (ws, request) => {
  console.log('📡 New WebSocket connection')
  
  const parsedUrl = url.parse(request.url, true)
  const roomId = parsedUrl.query.roomId
  
  if (!roomId) {
    console.error('❌ No roomId provided')
    ws.close(1008, 'Room ID required')
    return
  }
  
  console.log(`👥 Connection to room: ${roomId}`)
  
  // Get or create room
  let room = rooms.get(roomId)
  if (!room) {
    console.log(`🏠 Creating new room: ${roomId}`)
    room = new TLSocketRoom({
      initialSnapshot: undefined,
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
  
  // Handle WebSocket connection with tldraw sync
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

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`✅ tldraw sync server running on port ${PORT}`)
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}?roomId=<ROOM_ID>`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})
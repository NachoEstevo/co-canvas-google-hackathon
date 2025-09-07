const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')
const { TLSocketRoom } = require('@tldraw/sync-core')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store active rooms
const rooms = new Map()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create WebSocket server on the same port
  const wss = new WebSocketServer({ 
    server,
    path: '/api/sync'
  })

  console.log('🚀 Starting integrated Next.js + WebSocket server...')

  wss.on('connection', (ws, request) => {
    console.log('📡 New WebSocket connection to /api/sync')
    
    const parsedUrl = parse(request.url, true)
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

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`✅ Server ready on http://${hostname}:${port}`)
    console.log(`🔌 WebSocket sync available at ws://${hostname}:${port}/api/sync?roomId=<ROOM_ID>`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully')
    server.close(() => {
      process.exit(0)
    })
  })
})
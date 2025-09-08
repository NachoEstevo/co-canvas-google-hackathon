import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { TLSocketRoom } from '@tldraw/sync-core'

// Polyfill browser APIs that TLSocketRoom needs
global.addEventListener = () => {}
global.removeEventListener = () => {}
global.dispatchEvent = () => {}
global.Event = class Event {
  constructor(type) {
    this.type = type
  }
}
global.CustomEvent = class CustomEvent extends global.Event {
  constructor(type, options = {}) {
    super(type)
    this.detail = options.detail
  }
}
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {}
}
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {}
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT) || 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store active TLSocketRooms
const rooms = new Map()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Health check endpoint for Railway
      if (parsedUrl.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          status: 'ok', 
          activeRooms: rooms.size,
          timestamp: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV
        }))
        return
      }
      
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

  wss.on('connection', (ws, request) => {
    console.log('🔌 New WebSocket connection received')
    
    const parsedUrl = parse(request.url, true)
    const roomId = parsedUrl.query.roomId
    
    console.log('🏠 Room ID:', roomId)
    
    if (!roomId) {
      console.error('❌ No roomId provided')
      ws.close(1008, 'Room ID required')
      return
    }
    
    // Get or create TLSocketRoom
    let room = rooms.get(roomId)
    if (!room) {
      console.log(`🆕 Creating new TLSocketRoom for: ${roomId}`)
      room = new TLSocketRoom({
        initialSnapshot: undefined,
        onSessionRemoved: (room, args) => {
          console.log(`👋 Session removed from ${roomId}`)
          if (room.getNumActiveSessions() === 0) {
            console.log(`🗑️ Room ${roomId} is empty, cleaning up`)
            rooms.delete(roomId)
          }
        },
        onDataChange: () => {
          console.log(`💾 Data changed in room: ${roomId}`)
        }
      })
      rooms.set(roomId, room)
    } else {
      console.log(`♻️ Using existing room: ${roomId}`)
    }
    
    // Handle WebSocket connection with proper error handling
    try {
      console.log(`🔗 Connecting to TLSocketRoom for: ${roomId}`)
      
      // Set up error handlers before calling handleSocketConnect
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error in room ${roomId}:`, error)
      })
      
      ws.on('close', () => {
        console.log(`🔌 WebSocket closed for room: ${roomId}`)
      })
      
      // Now connect to the TLSocketRoom
      room.handleSocketConnect(ws)
      console.log(`✅ Successfully connected to room: ${roomId}`)
      
    } catch (error) {
      console.error('❌ Error handling socket connection:', error)
      try {
        ws.close()
      } catch (closeError) {
        console.error('❌ Error closing socket:', closeError)
      }
    }
  })

  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`Server ready on http://${hostname}:${port}`)
  })

  // Global error handlers to prevent crashes
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    // Don't exit in production, just log the error
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    // Don't exit in production, just log the error
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully')
    server.close(() => {
      process.exit(0)
    })
  })
})
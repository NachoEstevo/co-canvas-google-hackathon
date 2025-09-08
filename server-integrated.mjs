import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { TLSocketRoom } from '@tldraw/sync-core'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT) || 3000

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
    
    const parsedUrl = parse(request.url, true)
    const roomId = parsedUrl.query.roomId
    
    if (!roomId) {
      console.error('❌ No roomId provided')
      ws.close(1008, 'Room ID required')
      return
    }
    
    
    // Get or create room
    let room = rooms.get(roomId)
    if (!room) {
      room = new TLSocketRoom({
        initialSnapshot: undefined,
        onSessionRemoved: (room, args) => {
          if (room.getNumActiveSessions() === 0) {
            rooms.delete(roomId)
          }
        }
      })
      rooms.set(roomId, room)
    }
    
    // Handle WebSocket connection with tldraw sync
    room.handleSocketConnect(ws)
    
    ws.on('close', () => {
      // Connection closed
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
    console.log(`Server ready on http://${hostname}:${port}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0)
    })
  })
})
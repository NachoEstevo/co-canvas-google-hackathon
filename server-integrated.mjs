import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'

// Custom TLDraw sync protocol implementation
class SimpleTLDrawSync {
  constructor() {
    this.rooms = new Map()
  }

  handleConnection(ws, roomId) {
    // Get or create room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        clients: new Set(),
        data: new Map(), // Store document state
        lastUpdate: Date.now()
      })
    }

    const room = this.rooms.get(roomId)
    room.clients.add(ws)

    // Send initial sync message
    ws.send(JSON.stringify({
      type: 'connect',
      roomId,
      clientId: this.generateClientId()
    }))

    // Send current room data if any
    if (room.data.size > 0) {
      ws.send(JSON.stringify({
        type: 'document-state',
        data: Object.fromEntries(room.data)
      }))
    }

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data)
        this.handleMessage(ws, roomId, message)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })

    // Handle disconnect
    ws.on('close', () => {
      room.clients.delete(ws)
      
      // Cleanup empty rooms
      if (room.clients.size === 0) {
        setTimeout(() => {
          if (room.clients.size === 0) {
            this.rooms.delete(roomId)
          }
        }, 30000) // Keep room for 30 seconds after last client
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      room.clients.delete(ws)
    })
  }

  handleMessage(ws, roomId, message) {
    const room = this.rooms.get(roomId)
    if (!room) return

    switch (message.type) {
      case 'document-update':
        // Store the update
        if (message.changes) {
          message.changes.forEach(change => {
            if (change.added) {
              Object.entries(change.added).forEach(([key, value]) => {
                room.data.set(key, value)
              })
            }
            if (change.updated) {
              Object.entries(change.updated).forEach(([key, value]) => {
                room.data.set(key, value)
              })
            }
            if (change.removed) {
              change.removed.forEach(key => {
                room.data.delete(key)
              })
            }
          })
        }
        
        room.lastUpdate = Date.now()
        
        // Broadcast to all other clients
        room.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(message))
          }
        })
        break

      case 'presence':
        // Broadcast presence to all other clients
        room.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(message))
          }
        })
        break

      default:
        // Relay other messages
        room.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(message))
          }
        })
    }
  }

  generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT) || 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Initialize custom sync server
const syncServer = new SimpleTLDrawSync()

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
          activeRooms: syncServer.rooms.size,
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
    
    // Handle connection with custom sync
    try {
      syncServer.handleConnection(ws, roomId)
    } catch (error) {
      console.error('❌ Error handling sync connection:', error)
      ws.close()
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
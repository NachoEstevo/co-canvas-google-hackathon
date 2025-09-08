import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { TLSocketRoom } from '@tldraw/sync-core'

// Comprehensive browser API polyfills for TLSocketRoom
const mockElement = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  removeAttribute: () => {},
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false,
    toggle: () => {}
  }
}

global.addEventListener = () => {}
global.removeEventListener = () => {}
global.dispatchEvent = () => {}
global.setTimeout = setTimeout
global.clearTimeout = clearTimeout
global.setInterval = setInterval
global.clearInterval = clearInterval

global.Event = class Event {
  constructor(type, options = {}) {
    this.type = type
    this.bubbles = options.bubbles || false
    this.cancelable = options.cancelable || false
    this.target = null
    this.currentTarget = null
    this.defaultPrevented = false
  }
  preventDefault() { this.defaultPrevented = true }
  stopPropagation() {}
  stopImmediatePropagation() {}
}

global.CustomEvent = class CustomEvent extends global.Event {
  constructor(type, options = {}) {
    super(type, options)
    this.detail = options.detail
  }
}

global.MessageEvent = class MessageEvent extends global.Event {
  constructor(type, options = {}) {
    super(type, options)
    this.data = options.data
    this.origin = options.origin || ''
    this.source = options.source || null
  }
}

global.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: ''
}

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: global.location,
  document: null, // Will be set below
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: clearTimeout,
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  navigator: {
    userAgent: 'Node.js Server',
    platform: 'server'
  }
}

global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  createElement: () => mockElement,
  createElementNS: () => mockElement,
  getElementById: () => mockElement,
  querySelector: () => mockElement,
  querySelectorAll: () => [mockElement],
  body: mockElement,
  head: mockElement,
  documentElement: mockElement,
  createTextNode: () => ({ textContent: '' }),
  createDocumentFragment: () => mockElement
}

global.window.document = global.document

// WebSocket polyfills for TLDraw
global.WebSocket = global.WebSocket || class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // OPEN
    this.CONNECTING = 0
    this.OPEN = 1
    this.CLOSING = 2
    this.CLOSED = 3
  }
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
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
    const parsedUrl = parse(request.url, true)
    const roomId = parsedUrl.query.roomId
    
    if (!roomId) {
      console.error('❌ No roomId provided')
      ws.close(1008, 'Room ID required')
      return
    }
    
    // Get or create TLSocketRoom
    let room = rooms.get(roomId)
    if (!room) {
      room = new TLSocketRoom({
        initialSnapshot: undefined,
        onSessionRemoved: (room, args) => {
          if (room.getNumActiveSessions() === 0) {
            rooms.delete(roomId)
          }
        },
        onDataChange: () => {
          // Data persistence could go here
        }
      })
      rooms.set(roomId, room)
    }
    
    // Handle WebSocket connection with proper error handling
    try {
      // Set up error handlers before calling handleSocketConnect
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error in room ${roomId}:`, error)
      })
      
      ws.on('close', () => {
        // Connection cleanup handled by TLSocketRoom
      })
      
      // Connect to the TLSocketRoom
      room.handleSocketConnect(ws)
      
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
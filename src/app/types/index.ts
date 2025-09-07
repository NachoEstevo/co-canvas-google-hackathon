export interface GenerateImageRequest {
  prompt: string
  imageData?: string // SVG or base64 image data
  images?: ImageInput[] // For multi-image fusion
  roomId?: string
}

export interface ImageInput {
  data: string // base64 encoded image
  mimeType: string
  role?: 'subject' | 'style' | 'brand' // For fusion operations
}

export interface GenerateImageResponse {
  success: boolean
  content?: string
  imageUrl?: string
  error?: string
  details?: string
  usage?: any
}

export interface VoiceTranscriptionRequest {
  audioData: string // base64 encoded audio
}

export interface VoiceTranscriptionResponse {
  success: boolean
  transcript?: string
  error?: string
}

export interface CanvasState {
  roomId: string
  shapes: any[] // TLDRAW shapes
  users: CollaborativeUser[]
  lastUpdated: number
}

export interface CollaborativeUser {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
  selection?: string[]
}

export interface BrandKitItem {
  id: string
  imageUrl: string
  type: 'logo' | 'color-palette' | 'style-reference'
  name: string
}
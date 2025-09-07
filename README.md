# Nano Banana Hackathon Project

A Next.js application combining **Gemini 2.5 Flash Image** and **ElevenLabs Audio** for innovative multimodal experiences.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.local` and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ELEVENLABS_VOICE_ID=your_preferred_voice_id_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 🛠️ Tech Stack

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS
- **AI Models**: Gemini 2.5 Flash Image (NanoBanana)
- **Audio**: ElevenLabs Text-to-Speech
- **Development**: ESLint + Fast Refresh

## 📁 Project Structure

```
src/
├── app/           # Next.js app router
├── components/    # Reusable UI components
├── lib/           # API clients and utilities
│   ├── gemini.ts     # Gemini API integration
│   ├── elevenlabs.ts # ElevenLabs API integration
│   └── index.ts      # Utilities and exports
└── types/         # TypeScript definitions
```

## 🔗 API Integration

### Gemini 2.5 Flash Image
- Image analysis and understanding
- Text extraction from images
- Creative descriptions for audio narration
- Multi-modal content generation

### ElevenLabs Audio
- High-quality text-to-speech
- Multiple voice options
- Mood-based audio generation
- Real-time audio synthesis

## 🎯 Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🏆 Hackathon Strategy

See `HACKATHON_CONTEXT.md` for detailed planning, innovation opportunities, and competitive advantages.

---

*Ready to build something amazing! 🚀*
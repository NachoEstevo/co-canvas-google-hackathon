# Co-Creative Canvas - Development Context for Claude

## Project Status: CRITICAL ISSUES ⚠️
Co-Creative Canvas is a real-time collaborative design studio with AI image generation for Google Hackathon.

**Stack**: Next.js 15 + TypeScript + TLDRAW + Gemini 2.5 Flash Image + ElevenLabs
**Demo URL**: http://localhost:3000 (BROKEN - see TROUBLESHOOTING.md)
**Status**: APPLICATION COMPLETELY NON-FUNCTIONAL - URGENT FIX NEEDED

## 🚨 CURRENT CRITICAL ISSUES

### TLDRAW Canvas Not Rendering
- **SEVERITY**: CRITICAL - Application completely non-functional
- **ISSUE**: TLDRAW canvas is invisible/not loading at all
- **IMPACT**: Users see blank page, no drawing possible
- **STATUS**: Broken after attempting UI redesign

### CSS Styling Completely Broken  
- **SEVERITY**: CRITICAL - No visual styling applied
- **ISSUE**: Tailwind CSS not loading, all components unstyled
- **IMPACT**: Professional appearance lost, UI unusable
- **STATUS**: Broken during CSS refactoring attempts

### Recent Failed Changes
- **Layout Redesign**: Attempted navbar + contained canvas approach
- **CSS Restructure**: Moved TLDRAW CSS imports, broke styling
- **Multiple Dev Servers**: Created conflicts and build issues
- **Result**: Previously working features now completely broken

## 📋 PREVIOUSLY COMPLETED FEATURES (BROKEN)

### AI Workflow (WAS Working)
1. User draws on TLDRAW canvas ❌ (Canvas not visible)
2. Selects shapes with drag selection ❌ (No canvas)
3. Clicks ✨ AI Star Button ❌ (Not styled/visible)  
4. Professional dialog opens ❌ (Not styled)
5. Enters prompt like "Make this a wooden chair" ❌ (UI broken)
6. Gemini analyzes sketch + generates artwork ❌ (No access to canvas)
7. Generated art appears on canvas ❌ (No canvas)

## 🔧 URGENT RECOVERY NEEDED

### Immediate Actions Required
1. **STOP ALL CODE CHANGES** - No further development until fixed
2. **Restore Working State** - Revert to last known working version  
3. **Fix TLDRAW Canvas** - Essential for any functionality
4. **Repair CSS Pipeline** - Restore Tailwind and component styling
5. **Test Systematically** - Verify each component before proceeding

### Key Files (CURRENTLY BROKEN)
- `src/app/page.tsx` - Layout completely redesigned (BROKEN)
- `src/app/globals.css` - CSS imports restructured (BROKEN)  
- `src/app/components/Canvas/CollaborativeCanvas.tsx` - Container approach (BROKEN)
- All UI components - No styling applied (BROKEN)
- TROUBLESHOOTING.md - Detailed analysis of issues

## Current Environment
```env
GEMINI_API_KEY=[REDACTED - Check .env.local]  # Working
ELEVENLABS_API_KEY=[REDACTED - Check .env.local]  # Ready
R2_*=[REDACTED - Check .env.local]  # Image storage ready
NEXTAUTH_URL=http://localhost:3004  # Current port
```

## 🚨 CRITICAL RECOVERY PLAN

### Priority 1: RESTORE BASIC FUNCTIONALITY
**BEFORE ANY OTHER WORK CAN PROCEED:**
- [ ] Get TLDRAW canvas visible and interactive
- [ ] Restore Tailwind CSS styling
- [ ] Verify basic drawing functionality works
- [ ] Test that pages load with proper styling

### Priority 2: SYSTEMATIC COMPONENT RESTORATION
**ONLY AFTER Priority 1 is complete:**
- [ ] Restore AI button functionality
- [ ] Fix generation overlay styling  
- [ ] Test Gemini API integration
- [ ] Verify end-to-end AI workflow

### Priority 3: COLLABORATION FEATURES
**ONLY AFTER Priority 1-2 are complete:**
- [ ] Firebase real-time sync
- [ ] User presence indicators
- [ ] Voice annotations with ElevenLabs

## ⚠️ DEVELOPMENT RESTRICTIONS

### FORBIDDEN UNTIL FIXED
- ❌ **NO NEW FEATURES** - App is completely broken
- ❌ **NO UI/STYLING CHANGES** - Styling is completely broken  
- ❌ **NO ARCHITECTURE CHANGES** - Last changes broke everything
- ❌ **NO PERFORMANCE OPTIMIZATIONS** - Nothing works to optimize

### REQUIRED APPROACH
- ✅ **Restore working state first** - Essential before any work
- ✅ **Test each change individually** - Identify exact breaking points
- ✅ **Document every change** - Track what works/breaks
- ✅ **Focus on core functionality** - Canvas must work first

## 📊 Current Status Summary
- **Functionality**: 0% (Nothing works)
- **UI/UX**: 0% (No styling applied)
- **Core Features**: 0% (Canvas not visible)
- **Demo Readiness**: 0% (Completely broken)
- **Urgency Level**: MAXIMUM (Hackathon deadline approaching)

**CRITICAL**: Application went from working to completely non-functional. Immediate recovery action required before any development can continue.
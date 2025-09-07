'use client'

import { useState, useEffect } from 'react'
import type { TldrawEditor } from 'tldraw'

interface OnboardingStep {
  id: string
  title: string
  description: string
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  action?: string
  highlight?: string // CSS selector to highlight
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Co-Creative Canvas! 🎨',
    description: 'Let\'s take a quick tour to show you all the amazing features available.',
    position: 'center',
  },
  {
    id: 'drawing',
    title: 'Start Drawing',
    description: 'Use the tools on the left to draw shapes, lines, and sketches. Try drawing something simple!',
    position: 'center',
    action: 'Try drawing a shape on the canvas',
  },
  {
    id: 'ai-generation',
    title: 'AI Magic ✨',
    description: 'Select any drawing and click the AI star button to transform it with AI. Try "Make this a colorful flower"',
    position: 'top-right',
    highlight: '.ai-button', // Assuming AIButton has this class
  },
  {
    id: 'collaboration',
    title: 'Real-time Collaboration',
    description: 'See other users online in the top-left. Your cursor movements are visible to others in real-time!',
    position: 'top-left',
    highlight: '.user-presence',
  },
  {
    id: 'voice-notes',
    title: 'Voice Annotations 🎤',
    description: 'Double-click anywhere or use the voice button to add voice notes to your canvas.',
    position: 'bottom-left',
  },
  {
    id: 'export-save',
    title: 'Save & Export',
    description: 'Save your work to the cloud or export as PNG, SVG, or JSON using the buttons in the top-right.',
    position: 'top-right',
    highlight: '.export-save',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'Start creating amazing collaborative artwork with AI assistance. Have fun!',
    position: 'center',
  },
]

interface OnboardingTutorialProps {
  editor: any
  onComplete?: () => void
}

export function OnboardingTutorial({ editor, onComplete }: OnboardingTutorialProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem('onboarding-completed')
    if (!completed) {
      setIsVisible(true)
    } else {
      setHasCompletedOnboarding(true)
    }
  }, [])

  const currentStepData = onboardingSteps[currentStep]

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTutorial = () => {
    completeOnboarding()
  }

  const completeOnboarding = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsVisible(false)
    setHasCompletedOnboarding(true)
    onComplete?.()
  }

  const restartTutorial = () => {
    setCurrentStep(0)
    setIsVisible(true)
    setHasCompletedOnboarding(false)
  }

  const getPositionStyles = () => {
    switch (currentStepData.position) {
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    }
  }

  if (!isVisible && hasCompletedOnboarding) {
    return (
      <button
        onClick={restartTutorial}
        className="floating-button bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
        title="Restart Tutorial"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div className="tutorial-overlay inset-0 bg-black/50" />
      
      {/* Highlight effect for specific elements */}
      {currentStepData.highlight && (
        <style jsx global>{`
          ${currentStepData.highlight} {
            position: relative;
            z-index: 10000;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
            border-radius: 8px;
          }
        `}</style>
      )}

      {/* Tutorial modal */}
      <div className={`tutorial-overlay ${getPositionStyles()}`}>
        <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {currentStepData.title}
              </h3>
              <div className="text-white text-sm">
                {currentStep + 1} of {onboardingSteps.length}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              {currentStepData.description}
            </p>

            {currentStepData.action && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-blue-800 text-sm font-medium">
                  💡 {currentStepData.action}
                </p>
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={skipTutorial}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Skip Tutorial
              </button>

              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Back
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all hover:scale-105"
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Get Started!' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pointer indicator for positioned tooltips */}
        {currentStepData.position !== 'center' && (
          <div className={`absolute w-0 h-0 ${
            currentStepData.position.includes('top') ? 'top-full' : 
            currentStepData.position.includes('bottom') ? 'bottom-full' :
            'top-1/2 transform -translate-y-1/2'
          } ${
            currentStepData.position.includes('left') ? 'left-6' :
            currentStepData.position.includes('right') ? 'right-6' :
            'left-1/2 transform -translate-x-1/2'
          }`}>
            <div className={`border-8 ${
              currentStepData.position.includes('top') ? 'border-t-white border-l-transparent border-r-transparent border-b-transparent' :
              currentStepData.position.includes('bottom') ? 'border-b-white border-l-transparent border-r-transparent border-t-transparent' :
              ''
            }`} />
          </div>
        )}
      </div>
    </>
  )
}

// Quick help button component
export function QuickHelpButton() {
  const [showHelp, setShowHelp] = useState(false)

  const helpItems = [
    { key: 'Draw', action: 'Use tools on the left to draw shapes and sketches' },
    { key: 'AI Magic', action: 'Select shapes and click ✨ to transform with AI' },
    { key: 'Voice Notes', action: 'Double-click anywhere to add voice annotations' },
    { key: 'Collaborate', action: 'See other users and their cursors in real-time' },
    { key: 'Export', action: 'Save to cloud or export as PNG/SVG/JSON' },
  ]

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        <span>Help</span>
      </button>

      {showHelp && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[10000]" onClick={() => setShowHelp(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 z-[10001]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Quick Help</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {helpItems.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{item.key}</div>
                      <div className="text-xs text-gray-600">{item.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
'use client'

import { useState } from 'react'

interface AIButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function AIButton({ onClick, disabled = false }: AIButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-4 left-1/2 transform -translate-x-1/2 translate-x-80 z-[999]
        inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
        bg-primary text-primary-foreground hover:bg-primary/90
        border border-input shadow-sm transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:pointer-events-none disabled:opacity-50
        ${disabled ? 'bg-muted text-muted-foreground' : 'bg-slate-900 text-white hover:bg-slate-800'}
      `}
    >
      {/* Sparkles Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-200"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
      </svg>
      
      {/* Generate Text */}
      <span className="font-medium">
        Generate
      </span>
      
      {/* Tooltip */}
      <div className={`
        absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
        bg-popover text-popover-foreground text-xs px-2 py-1 rounded border shadow-md
        opacity-0 pointer-events-none transition-opacity duration-200
        whitespace-nowrap z-50
        ${isHovered ? 'opacity-100' : ''}
      `}>
        Generate AI Art
        <div className="absolute bottom-0 left-1/2 transform translate-y-1 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b rotate-45"></div>
      </div>

    </button>
  )
}
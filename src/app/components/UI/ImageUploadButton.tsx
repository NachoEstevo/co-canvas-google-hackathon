'use client'

import { useState, useRef } from 'react'

interface ImageUploadButtonProps {
  onImageUpload: (file: File) => void
}

export function ImageUploadButton({ onImageUpload }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true)
      onImageUpload(file)
      // Reset input
      e.target.value = ''
      setTimeout(() => setIsUploading(false), 2000)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
          border-0 shadow-md transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          ${isUploading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
          }
        `}
        title="Upload Image"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span>Upload Image</span>
          </>
        )}
      </button>
    </>
  )
}
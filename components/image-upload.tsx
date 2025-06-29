"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void
  className?: string
  existingImageUrl?: string
}

export function ImageUpload({ onImageSelected, className = "", existingImageUrl }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null)
  const [hasNewImage, setHasNewImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
      setHasNewImage(true)
    }
    reader.readAsDataURL(file)

    onImageSelected(file)
  }

  const handleRemoveImage = () => {
    setPreview(null)
    setHasNewImage(false)
    onImageSelected(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-4 ${className}`}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {preview ? (
        <div className="relative w-full h-full">
          <img
            src={preview || "/placeholder.svg"}
            alt="Face preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500/50 hover:bg-red-500/70 text-white"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {existingImageUrl && !hasNewImage && (
            <div className="absolute top-2 left-2">
              <span className="bg-blue-500/80 text-white px-2 py-1 rounded text-xs">Current Image</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 w-full h-full">
          <p className="text-sm text-gray-400 text-center">Upload a clear photo of your face for the best results</p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

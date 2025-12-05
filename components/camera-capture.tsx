"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (file: File) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const startCamera = async () => {
      try {
        setError(null)
        setIsCameraReady(false)
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setIsCameraReady(true)
            }).catch((err) => {
              console.error("Video play failed:", err)
              setError("Could not start video preview")
            })
          }
        }
      } catch (err) {
        console.error("Camera access error:", err)
        const message = err instanceof Error ? err.message : "Failed to access camera"
        if (message.includes("NotAllowedError") || message.includes("Permission")) {
          setError("Camera permission denied. Please allow camera access.")
        } else if (message.includes("NotFoundError")) {
          setError("No camera found on this device.")
        } else {
          setError(message)
        }
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      setIsCameraReady(false)
    }
  }, [isOpen])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext("2d")
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      onCapture(file)
      setIsOpen(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }, "image/jpeg")
  }

  const handleClose = () => {
    setIsOpen(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
        <Camera className="w-4 h-4" />
        Take Photo
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="relative bg-black rounded-t-lg overflow-hidden">
          {error ? (
            <div className="w-full h-80 flex items-center justify-center text-white text-center p-4">
              <p>{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-80 object-cover" 
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleCapture} disabled={!isCameraReady || !!error} className="w-full">
            Capture Photo
          </Button>
        </div>
      </div>
    </div>
  )
}

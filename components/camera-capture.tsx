"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, SwitchCamera } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (file: File) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraReady(false)
  }, [])

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    try {
      setError(null)
      setIsCameraReady(false)
      
      // Stop existing stream first
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
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
      } else if (message.includes("OverconstrainedError")) {
        // Fallback: try without facingMode constraint
        if (facing === "environment") {
          setError("Back camera not available. Using front camera.")
          setFacingMode("user")
        } else {
          setError(message)
        }
      } else {
        setError(message)
      }
    }
  }, [stopCamera])

  // Check for multiple cameras on mount
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === "videoinput")
        setHasMultipleCameras(videoDevices.length > 1)
      } catch {
        setHasMultipleCameras(false)
      }
    }
    checkCameras()
  }, [])

  useEffect(() => {
    if (!isOpen) return
    startCamera(facingMode)
    return () => stopCamera()
  }, [isOpen, facingMode, startCamera, stopCamera])

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext("2d")
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    
    // Mirror the image if using front camera for a more natural selfie
    if (facingMode === "user") {
      context.translate(canvasRef.current.width, 0)
      context.scale(-1, 1)
    }
    
    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      onCapture(file)
      setIsOpen(false)
      stopCamera()
    }, "image/jpeg")
  }

  const handleClose = () => {
    setIsOpen(false)
    stopCamera()
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
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full">
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
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Switch camera button */}
          {hasMultipleCameras && (
            <button
              onClick={handleSwitchCamera}
              className="absolute top-2 left-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
              title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}

          {/* Camera indicator */}
          {hasMultipleCameras && (
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              {facingMode === "user" ? "Front" : "Back"}
            </div>
          )}
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

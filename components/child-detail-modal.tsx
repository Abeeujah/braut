"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateChild, uploadChildPhotoForUpdate } from "@/app/actions/update-child"
import { CameraCapture } from "@/components/camera-capture"
import { X, Save, Pencil, Upload, Camera } from "lucide-react"
import type { ChildWithTicket } from "@/lib/tickets/queries"
import { compressImage, getFileSizeInMB } from "@/lib/utils/image-compression"

interface ChildDetailModalProps {
  child: ChildWithTicket
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function ChildDetailModal({ child, isOpen, onClose, onUpdate }: ChildDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(child.name)
  const [age, setAge] = useState(child.age.toString())
  const [className, setClassName] = useState(child.class)
  const [gender, setGender] = useState(child.gender)
  const [guardianPhone, setGuardianPhone] = useState(child.guardian_phone || "")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(child.photo_url || "")

  const processPhoto = async (file: File) => {
    try {
      let processedFile = file
      const fileSizeMB = getFileSizeInMB(file)
      
      if (fileSizeMB > 2) {
        processedFile = await compressImage(file, 800, 800, 0.8)
      }

      setPhotoFile(processedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(processedFile)
    } catch (err) {
      setError("Failed to process photo")
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processPhoto(file)
    }
  }

  const handleCameraCapture = async (file: File) => {
    await processPhoto(file)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let newPhotoUrl: string | null | undefined = undefined

      if (photoFile) {
        const uploadedUrl = await uploadChildPhotoForUpdate(photoFile, child.id)
        if (uploadedUrl) {
          newPhotoUrl = uploadedUrl
        } else {
          newPhotoUrl = photoPreview
        }
      }

      const result = await updateChild(child.id, {
        name,
        age: parseInt(age),
        class: className,
        gender: gender as "Male" | "Female",
        guardianPhone: guardianPhone || null,
        photoUrl: newPhotoUrl,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update")
      }

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update child")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setName(child.name)
    setAge(child.age.toString())
    setClassName(child.class)
    setGender(child.gender)
    setGuardianPhone(child.guardian_phone || "")
    setPhotoFile(null)
    setPhotoPreview(child.photo_url || "")
    setError(null)
    setIsEditing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center justify-between">
            {isEditing ? "Edit Child Details" : "Child Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                <CameraCapture onCapture={handleCameraCapture} />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Name</Label>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9"
                  />
                ) : (
                  <p className="font-medium text-foreground">{child.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Age</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="18"
                    className="h-9"
                  />
                ) : (
                  <p className="font-medium text-foreground">{child.age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Class</Label>
                {isEditing ? (
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nursery 1">Nursery 1</SelectItem>
                      <SelectItem value="Nursery 2">Nursery 2</SelectItem>
                      <SelectItem value="Nursery 3">Nursery 3</SelectItem>
                      <SelectItem value="Primary 1">Primary 1</SelectItem>
                      <SelectItem value="Primary 2">Primary 2</SelectItem>
                      <SelectItem value="Primary 3">Primary 3</SelectItem>
                      <SelectItem value="Primary 4">Primary 4</SelectItem>
                      <SelectItem value="Primary 5">Primary 5</SelectItem>
                      <SelectItem value="Primary 6">Primary 6</SelectItem>
                      <SelectItem value="JSS 1">JSS 1</SelectItem>
                      <SelectItem value="JSS 2">JSS 2</SelectItem>
                      <SelectItem value="JSS 3">JSS 3</SelectItem>
                      <SelectItem value="SSS 1">SSS 1</SelectItem>
                      <SelectItem value="SSS 2">SSS 2</SelectItem>
                      <SelectItem value="SSS 3">SSS 3</SelectItem>
                      <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium text-foreground">{child.class}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                {isEditing ? (
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium text-foreground">{child.gender}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Guardian's Phone</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="h-9"
                />
              ) : (
                <p className="font-medium text-foreground">
                  {child.guardian_phone || <span className="text-muted-foreground">Not provided</span>}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">House</Label>
                  <p className="font-medium text-foreground">{child.house || "Not assigned"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ticket #</Label>
                  <p className="font-mono font-medium text-foreground">
                    {child.ticket?.ticket_number || "N/A"}
                  </p>
                </div>
              </div>

              {child.registrar && (
                <div>
                  <Label className="text-xs text-muted-foreground">Registered by</Label>
                  <p className="font-medium text-foreground">{child.registrar.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !name || !age || !className || !gender}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

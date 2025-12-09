"use client";

import type React from "react";
import { registerChild, uploadChildPhoto } from "@/app/actions/register-child";

import { useState } from "react";
import { generateTicketId } from "@/lib/utils/ticket-generator";
import { compressImage, getFileSizeInMB } from "@/lib/utils/image-compression";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export function RegistrationForm({
  onSuccess,
}: {
  onSuccess?: (ticketId: string) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [className, setClassName] = useState("");
  const [gender, setGender] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  const processPhoto = async (file: File) => {
    try {
      const fileSizeMB = getFileSizeInMB(file);

      let processedFile = file;
      if (fileSizeMB > 2) {
        console.log(`[v0] Compressing image from ${fileSizeMB.toFixed(2)}MB`);
        processedFile = await compressImage(file, 800, 800, 0.8);
        console.log(
          `[v0] Compressed to ${getFileSizeInMB(processedFile).toFixed(2)}MB`,
        );
      }

      setPhotoFile(processedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process photo");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPhoto(file);
    }
  };

  const handleCameraCapture = async (file: File) => {
    await processPhoto(file);
  };

  const handleReviewClick = () => {
    if (!name || !age || !className || !gender || !guardianPhone) {
      setError("Please fill in all required fields before reviewing");
      return;
    }
    setShowReview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const ticketId = generateTicketId();

      let photoUrl = photoPreview;
      if (photoFile) {
        try {
          console.log(`[v0] Uploading photo via server action`);
          const uploadedUrl = await uploadChildPhoto(photoFile, ticketId);
          if (uploadedUrl) {
            photoUrl = uploadedUrl;
            console.log("[v0] Photo uploaded successfully");
          } else {
            console.warn("[v0] Photo upload failed - using base64 as fallback");
            photoUrl = photoPreview;
          }
        } catch (uploadErr) {
          console.warn("[v0] Using base64 photo storage as fallback");
          photoUrl = photoPreview;
        }
      }

      const result = await registerChild({
        name,
        age: Number.parseInt(age),
        class: className,
        gender: gender as "Male" | "Female",
        photoUrl,
        ticketId,
        guardianPhone: guardianPhone || null,
      });

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      setSuccessMessage(
        `Registration successful! ${name} has been assigned to House ${result.house}.`,
      );

      setName("");
      setAge("");
      setClassName("");
      setGender("");
      setGuardianPhone("");
      setPhotoFile(null);
      setPhotoPreview("");
      setShowReview(false);

      onSuccess?.(ticketId);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      console.error("[v0] Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showReview) {
    return (
      <div className="border border-border rounded-2xl p-6 sm:p-8 bg-card">
        <h3 className="font-serif text-2xl text-foreground mb-6">
          Review Details
        </h3>

        <div className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {photoPreview && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-border">
                <img
                  src={photoPreview || "/placeholder.svg"}
                  alt="Child"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Size: {photoFile ? getFileSizeInMB(photoFile).toFixed(2) : "0"}{" "}
                MB
              </p>
            </div>
          )}

          <div className="space-y-4 bg-muted/50 p-4 sm:p-6 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Child's Name
                </Label>
                <p className="text-base font-medium text-foreground mt-1">
                  {name}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Age</Label>
                <p className="text-base font-medium text-foreground mt-1">
                  {age}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Class</Label>
                <p className="text-base font-medium text-foreground mt-1">
                  {className}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <p className="text-base font-medium text-foreground mt-1">
                  {gender}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Guardian's Phone
              </Label>
              <p className="text-base font-medium text-foreground mt-1">
                {guardianPhone}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowReview(false);
                setError(null);
              }}
              disabled={isLoading}
              className="w-[50%] rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-[50%] rounded-full bg-foreground text-background hover:opacity-80"
            >
              {isLoading ? "Registering..." : "Confirm & Register"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl p-6 sm:p-8 bg-card">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-6"
      >
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Child's Name
            </Label>
            <Input
              id="name"
              placeholder="Enter child's full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="3"
              max="18"
              required
              className="rounded-lg border-border bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class" className="text-sm font-medium">
              Class
            </Label>
            <Select value={className} onValueChange={setClassName}>
              <SelectTrigger className="rounded-lg border-border bg-background">
                <SelectValue placeholder="Select class" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-medium">
              Gender
            </Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="rounded-lg border-border bg-background">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardianPhone" className="text-sm font-medium">
            Guardian's Phone Number
          </Label>
          <Input
            id="guardianPhone"
            type="tel"
            placeholder="e.g. 08012345678"
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            required
            className="rounded-lg border-border bg-background"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="photo" className="text-sm font-medium">
            Photo (Optional)
          </Label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center justify-center px-4 py-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-muted-foreground transition flex-1 min-w-[120px] bg-muted/30">
                <div className="flex items-center gap-2 text-center">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Upload photo
                  </span>
                </div>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <CameraCapture onCapture={handleCameraCapture} />
            </div>
            {photoPreview && (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs text-muted-foreground flex-1">
                  <p>Photo ready</p>
                  <p>
                    {photoFile ? getFileSizeInMB(photoFile).toFixed(2) : "0"} MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleReviewClick}
          disabled={!name || !age || !className || !gender || !guardianPhone}
          className="w-full rounded-full bg-foreground text-background hover:opacity-80"
        >
          Review & Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}

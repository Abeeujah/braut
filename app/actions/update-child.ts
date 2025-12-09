"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function updateChild(childId: string, childData: {
  name: string
  age: number
  class: string
  gender: "Male" | "Female"
  guardianPhone: string | null
  photoUrl?: string | null
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("You must be logged in to update children")
    }

    const updateData: Record<string, any> = {
      name: childData.name,
      age: childData.age,
      class: childData.class,
      gender: childData.gender,
      guardian_phone: childData.guardianPhone,
      updated_at: new Date().toISOString(),
    }

    if (childData.photoUrl !== undefined) {
      updateData.photo_url = childData.photoUrl
    }

    const { data: updatedChild, error } = await supabase
      .from("children")
      .update(updateData)
      .eq("id", childId)
      .select()
      .single()

    if (error) {
      console.error("[update-child] Error:", error)
      throw new Error(`Failed to update child: ${error.message}`)
    }

    return {
      success: true,
      child: updatedChild,
    }
  } catch (error) {
    console.error("[update-child] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function uploadChildPhotoForUpdate(photoFile: File, childId: string) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      },
    )

    const fileName = `${childId}-${Date.now()}.jpg`
    const buffer = await photoFile.arrayBuffer()

    const { error: uploadError } = await supabase.storage.from("child-photos").upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/jpeg",
    })

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        console.warn("[update-child] Storage bucket not found")
        return null
      }
      throw uploadError
    }

    const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/child-photos/${fileName}`
    return photoUrl
  } catch (error) {
    console.error("[update-child] Photo upload error:", error)
    return null
  }
}

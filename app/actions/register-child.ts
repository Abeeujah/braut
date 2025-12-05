"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { generateTicketNumber } from "@/lib/utils/ticket-generator"

export async function registerChild(childData: {
  name: string
  age: number
  class: string
  gender: "Male" | "Female"
  photoUrl: string | null
  ticketId: string
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

    const { data: insertedChild, error: childError } = await supabase
      .from("children")
      .insert({
        name: childData.name,
        age: childData.age,
        class: childData.class,
        gender: childData.gender,
        photo_url: childData.photoUrl,
        ticket_id: childData.ticketId,
      })
      .select()
      .single()

    if (childError) {
      console.error("[v0] Child insert error:", childError)
      throw new Error(`Failed to register child: ${childError.message}`)
    }

    const assignedHouse = insertedChild.house!

    const { count } = await supabase
      .from("children")
      .select("*", { count: "exact", head: true })
      .eq("house", assignedHouse)

    const ticketNumber = generateTicketNumber(assignedHouse, count || 1)

    const { error: ticketError } = await supabase.from("tickets").insert({
      id: childData.ticketId,
      child_id: insertedChild.id,
      ticket_number: ticketNumber,
      status: "active",
    })

    if (ticketError) {
      console.error("[v0] Ticket insert error:", ticketError)
      throw new Error(`Failed to create ticket: ${ticketError.message}`)
    }

    return {
      success: true,
      childId: insertedChild.id,
      ticketId: childData.ticketId,
      ticketNumber,
      house: assignedHouse,
    }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function uploadChildPhoto(photoFile: File, ticketId: string) {
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

    const fileName = `${ticketId}.jpg`
    const buffer = await photoFile.arrayBuffer()

    const { error: uploadError } = await supabase.storage.from("child-photos").upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/jpeg",
    })

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found")) {
        console.warn("[v0] Storage bucket not found - returning base64 fallback")
        return null
      }
      throw uploadError
    }

    const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/child-photos/${fileName}`
    return photoUrl
  } catch (error) {
    console.error("[v0] Photo upload error:", error)
    return null
  }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type Child = Database["public"]["Tables"]["children"]["Row"]
type Ticket = Database["public"]["Tables"]["tickets"]["Row"]
type Registrar = Database["public"]["Tables"]["registrars"]["Row"]

export interface ChildWithTicketForDownload extends Child {
  ticket: Ticket | null
  registrar: Pick<Registrar, "id" | "name"> | null
}

export interface BulkTicketsResult {
  children: ChildWithTicketForDownload[]
  total: number
}

export async function fetchAllChildrenForBulkDownload(
  search?: string,
  house?: string
): Promise<BulkTicketsResult> {
  const supabase = await createClient()

  let query = supabase
    .from("children")
    .select(
      `
      id,
      name,
      age,
      class,
      gender,
      photo_url,
      house,
      ticket_id,
      registered_by,
      created_at,
      updated_at,
      tickets (
        id,
        child_id,
        ticket_number,
        status,
        redeemed_at,
        created_at,
        updated_at
      ),
      registrars (
        id,
        name
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`)
  }

  if (house && house !== "all") {
    query = query.eq("house", house)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch children: ${error.message}`)
  }

  const children: ChildWithTicketForDownload[] =
    data?.map((c: any) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      class: c.class,
      gender: c.gender,
      photo_url: c.photo_url,
      house: c.house,
      ticket_id: c.ticket_id,
      registered_by: c.registered_by,
      created_at: c.created_at,
      updated_at: c.updated_at,
      ticket: Array.isArray(c.tickets) ? c.tickets[0] ?? null : c.tickets ?? null,
      registrar: c.registrars
        ? { id: c.registrars.id, name: c.registrars.name }
        : null,
    })) ?? []

  return { children, total: count ?? 0 }
}

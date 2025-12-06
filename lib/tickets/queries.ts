import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type Child = Database["public"]["Tables"]["children"]["Row"]
type Ticket = Database["public"]["Tables"]["tickets"]["Row"]
type Registrar = Database["public"]["Tables"]["registrars"]["Row"]

export type SortField = "created_at" | "name" | "house"
export type SortDir = "asc" | "desc"

export interface GetTicketsPageParams {
  page: number
  pageSize: number
  search?: string
  sortField?: SortField
  sortDir?: SortDir
  house?: string
}

export interface ChildWithTicket extends Child {
  ticket: Ticket | null
  registrar: Pick<Registrar, "id" | "name"> | null
}

export interface TicketsPageResult {
  rows: ChildWithTicket[]
  total: number
}

export async function getTicketsPage({
  page,
  pageSize,
  search,
  sortField = "created_at",
  sortDir = "desc",
  house,
}: GetTicketsPageParams): Promise<TicketsPageResult> {
  const supabase = await createClient()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

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

  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`)
  }

  if (house && house !== "all") {
    query = query.eq("house", house)
  }

  query = query.order(sortField, {
    ascending: sortDir === "asc",
    nullsFirst: false,
  })

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw error
  }

  const rows: ChildWithTicket[] =
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

  return { rows, total: count ?? 0 }
}

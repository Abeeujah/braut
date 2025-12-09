export type Database = {
  public: {
    Tables: {
      children: {
        Row: {
          id: string
          name: string
          age: number
          class: string
          gender: "Male" | "Female"
          photo_url: string | null
          house: "Love" | "Joy" | "Hope" | "Peace" | null
          ticket_id: string | null
          registered_by: string | null
          guardian_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          age: number
          class: string
          gender: "Male" | "Female"
          photo_url?: string | null
          house?: "Love" | "Joy" | "Hope" | "Peace" | null
          ticket_id?: string | null
          registered_by?: string | null
          guardian_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age?: number
          class?: string
          gender?: "Male" | "Female"
          photo_url?: string | null
          house?: "Love" | "Joy" | "Hope" | "Peace" | null
          ticket_id?: string | null
          registered_by?: string | null
          guardian_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      registrars: {
        Row: {
          id: string
          name: string
          email: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          child_id: string
          ticket_number: string
          status: "active" | "redeemed" | "void"
          redeemed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          child_id: string
          ticket_number: string
          status?: "active" | "redeemed" | "void"
          redeemed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          ticket_number?: string
          status?: "active" | "redeemed" | "void"
          redeemed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          total_children: number
          love_count: number
          joy_count: number
          hope_count: number
          peace_count: number
          redeemed_count: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

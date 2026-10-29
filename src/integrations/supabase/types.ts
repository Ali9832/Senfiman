export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      buildings: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["building_kind"]
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["building_kind"]
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["building_kind"]
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_secretary: string | null
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_anonymous: boolean
          kind: Database["public"]["Enums"]["complaint_kind"]
          resolution: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_secretary?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_anonymous?: boolean
          kind: Database["public"]["Enums"]["complaint_kind"]
          resolution?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_secretary?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_anonymous?: boolean
          kind?: Database["public"]["Enums"]["complaint_kind"]
          resolution?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faculty_inspections: {
        Row: {
          created_at: string
          custom_items: Json
          details: Json
          faculty_id: string
          id: string
          inspection_type: string
          location_value: string
          results: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_items?: Json
          details?: Json
          faculty_id: string
          id?: string
          inspection_type: string
          location_value: string
          results?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          custom_items?: Json
          details?: Json
          faculty_id?: string
          id?: string
          inspection_type?: string
          location_value?: string
          results?: Json
          user_id?: string
        }
        Relationships: []
      }
      faculty_locker_reservations: {
        Row: {
          cancelled_at: string | null
          id: string
          locker_id: string
          reserved_at: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          id?: string
          locker_id: string
          reserved_at?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          id?: string
          locker_id?: string
          reserved_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_locker_reservations_locker_id_fkey"
            columns: ["locker_id"]
            isOneToOne: false
            referencedRelation: "faculty_lockers"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_lockers: {
        Row: {
          created_at: string
          faculty_id: string
          id: string
          is_available: boolean
          number: number
        }
        Insert: {
          created_at?: string
          faculty_id: string
          id?: string
          is_available?: boolean
          number: number
        }
        Update: {
          created_at?: string
          faculty_id?: string
          id?: string
          is_available?: boolean
          number?: number
        }
        Relationships: []
      }
      food_menu_cache: {
        Row: {
          fetched_at: string
          id: string
          payload: Json
          user_id: string
          week_start: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          payload: Json
          user_id: string
          week_start: string
        }
        Update: {
          fetched_at?: string
          id?: string
          payload?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      internet_usage: {
        Row: {
          expires_at: string | null
          fetched_at: string
          total_mb: number
          used_mb: number
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          fetched_at?: string
          total_mb?: number
          used_mb?: number
          user_id: string
        }
        Update: {
          expires_at?: string | null
          fetched_at?: string
          total_mb?: number
          used_mb?: number
          user_id?: string
        }
        Relationships: []
      }
      item_requests: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          items: Json
          notes: string | null
          requested_by: string
          status: Database["public"]["Enums"]["item_request_status"]
          ticket_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          items: Json
          notes?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["item_request_status"]
          ticket_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          items?: Json
          notes?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["item_request_status"]
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          content: string
          created_at: string
          id: string
          published: boolean
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          content: string
          created_at?: string
          id?: string
          published?: boolean
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_loans: {
        Row: {
          author: string | null
          created_at: string
          due_date: string
          external_id: string | null
          fetched_at: string
          id: string
          loan_date: string | null
          returned: boolean
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          due_date: string
          external_id?: string | null
          fetched_at?: string
          id?: string
          loan_date?: string | null
          returned?: boolean
          title: string
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          due_date?: string
          external_id?: string | null
          fetched_at?: string
          id?: string
          loan_date?: string | null
          returned?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      locker_bans: {
        Row: {
          banned_until: string
          created_at: string
          created_by: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_until: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_until?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      locker_reservations: {
        Row: {
          building: string
          building_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          locker_number: string
          payment_deadline: string
          plan: Database["public"]["Enums"]["locker_plan"]
          price: number
          priority_tier: Database["public"]["Enums"]["locker_priority"] | null
          receipt_path: string | null
          reviewer_id: string | null
          reviewer_note: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["locker_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          building: string
          building_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          locker_number: string
          payment_deadline?: string
          plan: Database["public"]["Enums"]["locker_plan"]
          price: number
          priority_tier?: Database["public"]["Enums"]["locker_priority"] | null
          receipt_path?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["locker_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          building?: string
          building_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          locker_number?: string
          payment_deadline?: string
          plan?: Database["public"]["Enums"]["locker_plan"]
          price?: number
          priority_tier?: Database["public"]["Enums"]["locker_priority"] | null
          receipt_path?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["locker_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locker_reservations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_transfers: {
        Row: {
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          id: string
          meal_date: string
          meal_kind: Database["public"]["Enums"]["meal_kind"]
          meal_name: string | null
          qr_token: string
          receiver_id: string | null
          receiver_last_name: string
          receiver_student_code: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_type: Database["public"]["Enums"]["transfer_type"]
        }
        Insert: {
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          meal_date: string
          meal_kind: Database["public"]["Enums"]["meal_kind"]
          meal_name?: string | null
          qr_token?: string
          receiver_id?: string | null
          receiver_last_name: string
          receiver_student_code: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
        }
        Update: {
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          id?: string
          meal_date?: string
          meal_kind?: Database["public"]["Enums"]["meal_kind"]
          meal_name?: string | null
          qr_token?: string
          receiver_id?: string | null
          receiver_last_name?: string
          receiver_student_code?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          ticket_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          ticket_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          ticket_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          faculty: string | null
          first_name: string | null
          id: string
          last_name: string | null
          major: string | null
          phone: string | null
          resident_building_id: string | null
          student_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          faculty?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          major?: string | null
          phone?: string | null
          resident_building_id?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          faculty?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          major?: string | null
          phone?: string | null
          resident_building_id?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_resident_building_id_fkey"
            columns: ["resident_building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qc_inspections: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          location_type: Database["public"]["Enums"]["qc_location"]
          location_value: string
          notes: string | null
          overall_rating: number | null
          photo_path: string | null
          scores: Json
          user_id: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          location_type: Database["public"]["Enums"]["qc_location"]
          location_value: string
          notes?: string | null
          overall_rating?: number | null
          photo_path?: string | null
          scores?: Json
          user_id: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          location_type?: Database["public"]["Enums"]["qc_location"]
          location_value?: string
          notes?: string | null
          overall_rating?: number | null
          photo_path?: string | null
          scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_inspections_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["ticket_status"] | null
          id: string
          note: string | null
          ticket_id: string
          to_status: Database["public"]["Enums"]["ticket_status"] | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          note?: string | null
          ticket_id: string
          to_status?: Database["public"]["Enums"]["ticket_status"] | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["ticket_status"] | null
          id?: string
          note?: string | null
          ticket_id?: string
          to_status?: Database["public"]["Enums"]["ticket_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_schedules: {
        Row: {
          confirmed_at: string | null
          created_at: string
          id: string
          proposed_at: string
          proposed_by: string | null
          student_confirmed: boolean | null
          ticket_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          proposed_at: string
          proposed_by?: string | null
          student_confirmed?: boolean | null
          ticket_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          id?: string
          proposed_at?: string
          proposed_by?: string | null
          student_confirmed?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_schedules_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          priority_final: Database["public"]["Enums"]["ticket_priority"] | null
          priority_suggested: Database["public"]["Enums"]["ticket_priority"]
          reopen_count: number
          room_no: string | null
          satisfaction: number | null
          satisfaction_note: string | null
          sla_due_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
          warden_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          priority_final?: Database["public"]["Enums"]["ticket_priority"] | null
          priority_suggested?: Database["public"]["Enums"]["ticket_priority"]
          reopen_count?: number
          room_no?: string | null
          satisfaction?: number | null
          satisfaction_note?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
          warden_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority_final?: Database["public"]["Enums"]["ticket_priority"] | null
          priority_suggested?: Database["public"]["Enums"]["ticket_priority"]
          reopen_count?: number
          room_no?: string | null
          satisfaction?: number | null
          satisfaction_note?: string | null
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      university_credentials: {
        Row: {
          id: string
          password_encrypted: string
          system: Database["public"]["Enums"]["uni_system"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          id?: string
          password_encrypted: string
          system: Database["public"]["Enums"]["uni_system"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          id?: string
          password_encrypted?: string
          system?: Database["public"]["Enums"]["uni_system"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          faculty: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          faculty?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          faculty?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_ticket: { Args: { _ticket_id: string }; Returns: boolean }
      escalate_overdue_tickets: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_central_council: { Args: { _uid: string }; Returns: boolean }
      promote_to_central_council: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "student"
        | "council_member"
        | "admin"
        | "warden"
        | "services"
        | "warehouse"
        | "council_secretary"
        | "central_council"
      building_kind: "faculty" | "dorm" | "cafeteria" | "other"
      complaint_kind: "complaint" | "criticism" | "suggestion"
      complaint_status: "open" | "in_review" | "resolved" | "rejected"
      item_request_status: "requested" | "fulfilled" | "cancelled"
      locker_plan: "m1" | "m2" | "m3" | "semester"
      locker_priority: "host" | "guest"
      locker_status:
        | "pending_payment"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "expired"
      meal_kind: "lunch" | "dinner"
      qc_location: "cafeteria" | "dorm" | "classroom" | "restroom"
      ticket_category:
        | "facilities"
        | "services"
        | "safety"
        | "admin"
        | "complaint"
      ticket_priority: "critical" | "high" | "medium" | "low"
      ticket_status:
        | "submitted"
        | "pending_warden"
        | "assigned"
        | "awaiting_student_time"
        | "in_progress"
        | "needs_items"
        | "items_requested"
        | "items_ready"
        | "completed"
        | "closed"
        | "reopened"
        | "rejected"
        | "cancelled"
      transfer_status:
        | "pending"
        | "approved"
        | "rejected"
        | "consumed"
        | "expired"
      transfer_type: "send" | "request"
      uni_system: "food" | "library" | "internet"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "student",
        "council_member",
        "admin",
        "warden",
        "services",
        "warehouse",
        "council_secretary",
        "central_council",
      ],
      building_kind: ["faculty", "dorm", "cafeteria", "other"],
      complaint_kind: ["complaint", "criticism", "suggestion"],
      complaint_status: ["open", "in_review", "resolved", "rejected"],
      item_request_status: ["requested", "fulfilled", "cancelled"],
      locker_plan: ["m1", "m2", "m3", "semester"],
      locker_priority: ["host", "guest"],
      locker_status: [
        "pending_payment",
        "pending_approval",
        "approved",
        "rejected",
        "expired",
      ],
      meal_kind: ["lunch", "dinner"],
      qc_location: ["cafeteria", "dorm", "classroom", "restroom"],
      ticket_category: [
        "facilities",
        "services",
        "safety",
        "admin",
        "complaint",
      ],
      ticket_priority: ["critical", "high", "medium", "low"],
      ticket_status: [
        "submitted",
        "pending_warden",
        "assigned",
        "awaiting_student_time",
        "in_progress",
        "needs_items",
        "items_requested",
        "items_ready",
        "completed",
        "closed",
        "reopened",
        "rejected",
        "cancelled",
      ],
      transfer_status: [
        "pending",
        "approved",
        "rejected",
        "consumed",
        "expired",
      ],
      transfer_type: ["send", "request"],
      uni_system: ["food", "library", "internet"],
    },
  },
} as const

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      countdowns: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          notify_days_before: number[] | null
          target_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          notify_days_before?: number[] | null
          target_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          notify_days_before?: number[] | null
          target_date?: string
          title?: string
        }
        Relationships: []
      }
      couple: {
        Row: {
          created_at: string | null
          id: string
          started_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          started_at: string
        }
        Update: {
          created_at?: string | null
          id?: string
          started_at?: string
        }
        Relationships: []
      }
      daily_answers: {
        Row: {
          answer: string
          assignment_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          answer: string
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          answer?: string
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_answers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "daily_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_assignments: {
        Row: {
          assigned_date: string
          id: string
          question_id: string | null
        }
        Insert: {
          assigned_date: string
          id?: string
          question_id?: string | null
        }
        Update: {
          assigned_date?: string
          id?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_assignments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_questions: {
        Row: {
          category: string | null
          id: string
          question_text: string
        }
        Insert: {
          category?: string | null
          id?: string
          question_text: string
        }
        Update: {
          category?: string | null
          id?: string
          question_text?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          added_by: string | null
          cover_url: string | null
          created_at: string | null
          external_id: string | null
          id: string
          status: string
          title: string
          type: string
        }
        Insert: {
          added_by?: string | null
          cover_url?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          status?: string
          title: string
          type: string
        }
        Update: {
          added_by?: string | null
          cover_url?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          finished_at: string | null
          id: string
          media_id: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          media_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          media_id?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_reviews_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string | null
          created_by: string | null
          id: string
          location_name: string | null
          memory_date: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_name?: string | null
          memory_date: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_name?: string | null
          memory_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_photos: {
        Row: {
          id: string
          memory_id: string | null
          position: number | null
          storage_path: string
        }
        Insert: {
          id?: string
          memory_id?: string | null
          position?: number | null
          storage_path: string
        }
        Update: {
          id?: string
          memory_id?: string | null
          position?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_photos_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      place_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          place_id: string | null
          rating_ambience: number | null
          rating_quality: number | null
          rating_value: number | null
          user_id: string | null
          would_return: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          place_id?: string | null
          rating_ambience?: number | null
          rating_quality?: number | null
          rating_value?: number | null
          user_id?: string | null
          would_return?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          place_id?: string | null
          rating_ambience?: number | null
          rating_quality?: number | null
          rating_value?: number | null
          user_id?: string | null
          would_return?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "place_reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          type: string
          visited_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          type?: string
          visited_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          type?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          expo_push_token: string | null
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          expo_push_token?: string | null
          id: string
          name?: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          expo_push_token?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      streak: {
        Row: {
          current_count: number | null
          id: string
          last_complete_date: string | null
          longest_count: number | null
        }
        Insert: {
          current_count?: number | null
          id?: string
          last_complete_date?: string | null
          longest_count?: number | null
        }
        Update: {
          current_count?: number | null
          id?: string
          last_complete_date?: string | null
          longest_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

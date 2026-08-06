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
      auction_settings: {
        Row: {
          auction_round: number
          base_price_a: number
          base_price_b: number
          base_price_c: number
          bid_increment: number
          current_bid: number | null
          current_bid_team_id: string | null
          current_player_id: string | null
          id: number
          is_live: boolean
          players_per_team: number
          team_budget: number
          updated_at: string
        }
        Insert: {
          auction_round?: number
          base_price_a?: number
          base_price_b?: number
          base_price_c?: number
          bid_increment?: number
          current_bid?: number | null
          current_bid_team_id?: string | null
          current_player_id?: string | null
          id?: number
          is_live?: boolean
          players_per_team?: number
          team_budget?: number
          updated_at?: string
        }
        Update: {
          auction_round?: number
          base_price_a?: number
          base_price_b?: number
          base_price_c?: number
          bid_increment?: number
          current_bid?: number | null
          current_bid_team_id?: string | null
          current_player_id?: string | null
          id?: number
          is_live?: boolean
          players_per_team?: number
          team_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          created_at: string
          id: string
          player_id: string
          team_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          player_id: string
          team_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          ball_number: number
          created_at: string
          description: string | null
          event_type: string
          id: string
          innings: number
          match_id: string
          over_number: number
          runs: number
          team_name: string | null
        }
        Insert: {
          ball_number?: number
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          innings?: number
          match_id: string
          over_number?: number
          runs?: number
          team_name?: string | null
        }
        Update: {
          ball_number?: number
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          innings?: number
          match_id?: string
          over_number?: number
          runs?: number
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          batting_team: string | null
          commentary: string | null
          created_at: string
          current_innings: number
          highlight_url: string | null
          id: string
          is_featured: boolean
          match_date: string | null
          result_summary: string | null
          status: Database["public"]["Enums"]["match_status"]
          team_a_logo_url: string | null
          team_a_name: string
          team_a_overs: number
          team_a_score: number
          team_a_wickets: number
          team_b_logo_url: string | null
          team_b_name: string
          team_b_overs: number
          team_b_score: number
          team_b_wickets: number
          toss_decision: string | null
          toss_info: string | null
          toss_winner: string | null
          updated_at: string
          venue: string | null
          youtube_url: string | null
        }
        Insert: {
          batting_team?: string | null
          commentary?: string | null
          created_at?: string
          current_innings?: number
          highlight_url?: string | null
          id?: string
          is_featured?: boolean
          match_date?: string | null
          result_summary?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_logo_url?: string | null
          team_a_name: string
          team_a_overs?: number
          team_a_score?: number
          team_a_wickets?: number
          team_b_logo_url?: string | null
          team_b_name: string
          team_b_overs?: number
          team_b_score?: number
          team_b_wickets?: number
          toss_decision?: string | null
          toss_info?: string | null
          toss_winner?: string | null
          updated_at?: string
          venue?: string | null
          youtube_url?: string | null
        }
        Update: {
          batting_team?: string | null
          commentary?: string | null
          created_at?: string
          current_innings?: number
          highlight_url?: string | null
          id?: string
          is_featured?: boolean
          match_date?: string | null
          result_summary?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          team_a_logo_url?: string | null
          team_a_name?: string
          team_a_overs?: number
          team_a_score?: number
          team_a_wickets?: number
          team_b_logo_url?: string | null
          team_b_name?: string
          team_b_overs?: number
          team_b_score?: number
          team_b_wickets?: number
          toss_decision?: string | null
          toss_info?: string | null
          toss_winner?: string | null
          updated_at?: string
          venue?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      player_contacts: {
        Row: {
          created_at: string
          email: string | null
          phone: string | null
          player_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          phone?: string | null
          player_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          phone?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_contacts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          achievements: string | null
          age: number | null
          ai_summary: string | null
          auction_round: number | null
          base_price: number | null
          batting_average: number | null
          batting_style: string | null
          best_bowling: string | null
          bowling_average: number | null
          bowling_style: string | null
          category: Database["public"]["Enums"]["player_category"] | null
          created_at: string
          extra_info: string | null
          fitness_level: number | null
          fitness_notes: string | null
          full_name: string
          gender: Database["public"]["Enums"]["player_gender"]
          highest_score: number | null
          id: string
          is_pre_assigned: boolean
          matches_played: number | null
          photo_url: string | null
          primary_role: Database["public"]["Enums"]["player_role"]
          skill_level: number | null
          sold_price: number | null
          sold_to_team_id: string | null
          status: Database["public"]["Enums"]["player_status"]
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          achievements?: string | null
          age?: number | null
          ai_summary?: string | null
          auction_round?: number | null
          base_price?: number | null
          batting_average?: number | null
          batting_style?: string | null
          best_bowling?: string | null
          bowling_average?: number | null
          bowling_style?: string | null
          category?: Database["public"]["Enums"]["player_category"] | null
          created_at?: string
          extra_info?: string | null
          fitness_level?: number | null
          fitness_notes?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["player_gender"]
          highest_score?: number | null
          id?: string
          is_pre_assigned?: boolean
          matches_played?: number | null
          photo_url?: string | null
          primary_role?: Database["public"]["Enums"]["player_role"]
          skill_level?: number | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          achievements?: string | null
          age?: number | null
          ai_summary?: string | null
          auction_round?: number | null
          base_price?: number | null
          batting_average?: number | null
          batting_style?: string | null
          best_bowling?: string | null
          bowling_average?: number | null
          bowling_style?: string | null
          category?: Database["public"]["Enums"]["player_category"] | null
          created_at?: string
          extra_info?: string | null
          fitness_level?: number | null
          fitness_notes?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["player_gender"]
          highest_score?: number | null
          id?: string
          is_pre_assigned?: boolean
          matches_played?: number | null
          photo_url?: string | null
          primary_role?: Database["public"]["Enums"]["player_role"]
          skill_level?: number | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_sold_to_team_id_fkey"
            columns: ["sold_to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          budget_remaining: number
          created_at: string
          id: string
          logo_url: string | null
          manager_id: string
          manager_name: string
          team_name: string
        }
        Insert: {
          budget_remaining?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          manager_id: string
          manager_name: string
          team_name: string
        }
        Update: {
          budget_remaining?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          manager_id?: string
          manager_name?: string
          team_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      claim_admin_role: { Args: never; Returns: boolean }
      get_team_logos: {
        Args: never
        Returns: {
          logo_url: string
          team_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_current_unsold: { Args: never; Returns: undefined }
      place_bid: { Args: { _amount: number }; Returns: undefined }
      pre_assign_player: {
        Args: { _player_id: string; _team_id: string }
        Returns: undefined
      }
      reset_player_assignment: {
        Args: { _player_id: string }
        Returns: undefined
      }
      sell_current_player: { Args: never; Returns: undefined }
      set_auction_live: { Args: { _live: boolean }; Returns: undefined }
      set_current_player: { Args: { _player_id: string }; Returns: undefined }
      start_next_round: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "team_manager" | "player"
      match_status: "upcoming" | "live" | "completed"
      player_category: "A" | "B" | "C"
      player_gender: "male" | "female"
      player_role: "batsman" | "bowler" | "all_rounder" | "wicket_keeper"
      player_status:
        | "pending"
        | "available"
        | "sold"
        | "unsold"
        | "pre_assigned"
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
      app_role: ["admin", "team_manager", "player"],
      match_status: ["upcoming", "live", "completed"],
      player_category: ["A", "B", "C"],
      player_gender: ["male", "female"],
      player_role: ["batsman", "bowler", "all_rounder", "wicket_keeper"],
      player_status: ["pending", "available", "sold", "unsold", "pre_assigned"],
    },
  },
} as const

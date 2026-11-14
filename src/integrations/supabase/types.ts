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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      tailor_records: {
        Row: {
          created_at: string
          data: Json
          deleted: boolean
          id: string
          kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          deleted?: boolean
          id: string
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          deleted?: boolean
          id?: string
          kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_email: string
          created_at: string | null
          identifier: string
          recovery_pin: string
          user_id: string
          username: string
        }
        Insert: {
          auth_email: string
          created_at?: string | null
          identifier: string
          recovery_pin: string
          user_id: string
          username: string
        }
        Update: {
          auth_email?: string
          created_at?: string | null
          identifier?: string
          recovery_pin?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      vip_devices: {
        Row: {
          activated_at: string | null
          code: string
          device_id: string
          expires_at: number
          plan_label: string | null
        }
        Insert: {
          activated_at?: string | null
          code: string
          device_id: string
          expires_at: number
          plan_label?: string | null
        }
        Update: {
          activated_at?: string | null
          code?: string
          device_id?: string
          expires_at?: number
          plan_label?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_user_password: {
        Args: { new_password: string; target_auth_email: string }
        Returns: undefined
      }
      check_username_exists: {
        Args: { input_username: string }
        Returns: boolean
      }
      check_vip_by_device: {
        Args: { p_device_id: string }
        Returns: {
          expires_at: number
          plan_label: string
        }[]
      }
      claim_vip_code: {
        Args: {
          p_code: string
          p_device_id: string
          p_expires_at: number
          p_plan_label: string
        }
        Returns: string
      }
      generate_server_reset_code: {
        Args: {
          admin_email: string
          admin_password: string
          target_identifier: string
        }
        Returns: string
      }
      generate_server_vip_code: {
        Args: {
          admin_email: string
          admin_password: string
          days_valid: number
          plan_tag: string
        }
        Returns: string
      }
      get_login_identifier: {
        Args: { input_username: string }
        Returns: string
      }
      internal_sign_payload: { Args: { payload: string }; Returns: string }
      recover_user_password: {
        Args: {
          input_id: string
          input_pin: string
          is_admin_verified: boolean
          new_password: string
        }
        Returns: string
      }
      recover_user_password_v2: {
        Args: { input_id: string; input_secret: string; new_password: string }
        Returns: string
      }
      redeem_server_vip_code: {
        Args: { p_code: string; p_device_id: string }
        Returns: Json
      }
      verify_admin_credentials: {
        Args: { input_email: string; input_password: string }
        Returns: boolean
      }
      verify_admin_gate: { Args: { input_gate: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

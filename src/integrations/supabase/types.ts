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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_category: string
          account_type: string
          amount: number
          bank: string
          billing_type: string
          created_at: string
          due_day: number
          id: string
          is_template: boolean | null
          month_year: string
          name: string
          paid: boolean
          paid_at: string | null
          parent_id: string | null
          receipt_url: string | null
          remaining_months: number | null
          start_date: string
          total_debt_amount: number | null
          user_id: string
        }
        Insert: {
          account_category?: string
          account_type?: string
          amount?: number
          bank?: string
          billing_type?: string
          created_at?: string
          due_day?: number
          id?: string
          is_template?: boolean | null
          month_year: string
          name: string
          paid?: boolean
          paid_at?: string | null
          parent_id?: string | null
          receipt_url?: string | null
          remaining_months?: number | null
          start_date?: string
          total_debt_amount?: number | null
          user_id: string
        }
        Update: {
          account_category?: string
          account_type?: string
          amount?: number
          bank?: string
          billing_type?: string
          created_at?: string
          due_day?: number
          id?: string
          is_template?: boolean | null
          month_year?: string
          name?: string
          paid?: boolean
          paid_at?: string | null
          parent_id?: string | null
          receipt_url?: string | null
          remaining_months?: number | null
          start_date?: string
          total_debt_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string
          download_url: string
          id: string
          message: string
          min_version: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url?: string
          id?: string
          message?: string
          min_version?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string
          id?: string
          message?: string
          min_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          amount_saved: number
          created_at: string
          id: string
          status_date: string
          user_challenge_id: string
        }
        Insert: {
          amount_saved?: number
          created_at?: string
          id?: string
          status_date: string
          user_challenge_id: string
        }
        Update: {
          amount_saved?: number
          created_at?: string
          id?: string
          status_date?: string
          user_challenge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_user_challenge_id_fkey"
            columns: ["user_challenge_id"]
            isOneToOne: false
            referencedRelation: "user_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          created_at: string
          data_pagamento: string
          debt_id: string
          id: string
          parcelas_quitadas: number
          tipo_pagamento: string
          user_id: string
          valor_pago: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string
          debt_id: string
          id?: string
          parcelas_quitadas?: number
          tipo_pagamento?: string
          user_id: string
          valor_pago?: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string
          debt_id?: string
          id?: string
          parcelas_quitadas?: number
          tipo_pagamento?: string
          user_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_simulations: {
        Row: {
          created_at: string
          debt_id: string
          economia_juros: number
          estrategia: string
          id: string
          meses_estimados: number
          sobra_mensal: number
          total_pago: number
          user_id: string
          valor_mensal: number
        }
        Insert: {
          created_at?: string
          debt_id: string
          economia_juros?: number
          estrategia?: string
          id?: string
          meses_estimados?: number
          sobra_mensal?: number
          total_pago?: number
          user_id: string
          valor_mensal?: number
        }
        Update: {
          created_at?: string
          debt_id?: string
          economia_juros?: number
          estrategia?: string
          id?: string
          meses_estimados?: number
          sobra_mensal?: number
          total_pago?: number
          user_id?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_simulations_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          account_id: string | null
          created_at: string
          dia_vencimento: number
          id: string
          juros_mensal: number
          nome: string
          parcela_mensal: number
          parcelas_restantes: number | null
          permite_amortizacao: boolean
          permite_antecipacao: boolean
          tipo: string
          total_parcelas: number | null
          updated_at: string
          user_id: string
          valor_restante: number
          valor_total: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          dia_vencimento?: number
          id?: string
          juros_mensal?: number
          nome: string
          parcela_mensal?: number
          parcelas_restantes?: number | null
          permite_amortizacao?: boolean
          permite_antecipacao?: boolean
          tipo?: string
          total_parcelas?: number | null
          updated_at?: string
          user_id: string
          valor_restante?: number
          valor_total?: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          dia_vencimento?: number
          id?: string
          juros_mensal?: number
          nome?: string
          parcela_mensal?: number
          parcelas_restantes?: number | null
          permite_amortizacao?: boolean
          permite_antecipacao?: boolean
          tipo?: string
          total_parcelas?: number | null
          updated_at?: string
          user_id?: string
          valor_restante?: number
          valor_total?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          due_date: number | null
          frequency: string | null
          id: string
          next_due_date: string | null
          receipt_url: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          due_date?: number | null
          frequency?: string | null
          id?: string
          next_due_date?: string | null
          receipt_url?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          due_date?: number | null
          frequency?: string | null
          id?: string
          next_due_date?: string | null
          receipt_url?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      extra_income: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          month_year: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description: string
          id?: string
          month_year: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          month_year?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          is_auto: boolean
          monthly_amount: number
          name: string
          priority: number
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          is_auto?: boolean
          monthly_amount?: number
          name: string
          priority?: number
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          is_auto?: boolean
          monthly_amount?: number
          name?: string
          priority?: number
          target_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          bank: string
          created_at: string
          current_amount: number | null
          id: string
          investment_type: string
          name: string
          start_date: string
          user_id: string
        }
        Insert: {
          amount?: number
          bank?: string
          created_at?: string
          current_amount?: number | null
          id?: string
          investment_type?: string
          name: string
          start_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank?: string
          created_at?: string
          current_amount?: number | null
          id?: string
          investment_type?: string
          name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      salary: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_year: string
          received: boolean
          received_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          month_year: string
          received?: boolean
          received_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          received?: boolean
          received_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          created_at: string
          event_notifications_enabled: boolean
          id: string
          reminder_days_before: number
          reminder_hour: number
          streak_reminders_enabled: boolean
          telegram_chat_id: number | null
          telegram_user_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_notifications_enabled?: boolean
          id?: string
          reminder_days_before?: number
          reminder_hour?: number
          streak_reminders_enabled?: boolean
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_notifications_enabled?: boolean
          id?: string
          reminder_days_before?: number
          reminder_hour?: number
          streak_reminders_enabled?: boolean
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          start_date?: string
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          start_date?: string
          status?: string
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Expense {
  id: string
  user_id: string
  description: string
  amount: number
  category: string
  date: string
  type: 'unique' | 'recurring'
  frequency?: 'monthly' | 'weekly' | 'daily'
  due_date?: number
  next_due_date?: string
  created_at: string
}

export interface TelegramConfig {
  id: string
  user_id: string
  telegram_user_id: number
  telegram_chat_id: number
  telegram_username?: string
  bot_token: string
  reminder_days_before: number
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ExpenseChecklist {
  id: string
  user_id: string
  expense_id: string
  month_year: string
  paid: boolean
  proof_url?: string
  paid_at?: string
  created_at: string
}

export type Account = Database["public"]["Tables"]["accounts"]["Row"]

export type Investment = Database["public"]["Tables"]["investments"]["Row"]

export interface ReminderLog {
  id: string
  user_id: string
  expense_id: string
  month_year: string
  reminder_sent_at?: string
  reminder_type: 'two_days' | 'one_day' | 'due_date'
  created_at: string
}

export interface AccountPayment {
  id: string
  user_id: string
  account_id: string
  month_year: string
  amount: number
  paid_at?: string
  receipt_url?: string
  created_at: string
}

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
          month_year: string
          name: string
          paid: boolean
          paid_at: string | null
          start_date: string
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
          month_year: string
          name: string
          paid?: boolean
          paid_at?: string | null
          start_date?: string
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
          month_year?: string
          name?: string
          paid?: boolean
          paid_at?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      account_payments: {
        Row: {
          id: string
          user_id: string
          account_id: string
          month_year: string
          amount: number
          paid_at: string | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          month_year: string
          amount: number
          paid_at?: string | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          month_year?: string
          amount?: number
          paid_at?: string | null
          receipt_url?: string | null
          created_at?: string
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
          type?: string | null
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
          id: string
          reminder_days_before: number
          telegram_chat_id: number | null
          telegram_user_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_days_before?: number
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_days_before?: number
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          updated_at?: string
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

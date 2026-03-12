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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_companies: {
        Row: {
          auth_user_id: string | null
          auto_escalate_after_broken_promises: number | null
          blocked_days: string[] | null
          business_address: Json | null
          business_email: string | null
          business_phone: string | null
          company_logo_url: string | null
          company_name: string
          contact_hours_end: string | null
          contact_hours_start: string | null
          created_at: string | null
          default_currency: string | null
          default_floor_percentage: number | null
          default_link_expiry_hours: number | null
          id: string
          industry: string | null
          max_contacts_per_7_days: number | null
          onboarding_complete: boolean | null
          platform_fee_percentage: number | null
          role: string | null
          sendgrid_api_key: string | null
          sendgrid_from_email: string | null
          sendgrid_from_name: string | null
          sendgrid_reply_to_email: string | null
          status: string | null
          stripe_connect_account_id: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          updated_at: string | null
          vapi_api_key: string | null
          vapi_assistant_id: string | null
          voice_agent_name: string | null
        }
        Insert: {
          auth_user_id?: string | null
          auto_escalate_after_broken_promises?: number | null
          blocked_days?: string[] | null
          business_address?: Json | null
          business_email?: string | null
          business_phone?: string | null
          company_logo_url?: string | null
          company_name: string
          contact_hours_end?: string | null
          contact_hours_start?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_floor_percentage?: number | null
          default_link_expiry_hours?: number | null
          id?: string
          industry?: string | null
          max_contacts_per_7_days?: number | null
          onboarding_complete?: boolean | null
          platform_fee_percentage?: number | null
          role?: string | null
          sendgrid_api_key?: string | null
          sendgrid_from_email?: string | null
          sendgrid_from_name?: string | null
          sendgrid_reply_to_email?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          updated_at?: string | null
          vapi_api_key?: string | null
          vapi_assistant_id?: string | null
          voice_agent_name?: string | null
        }
        Update: {
          auth_user_id?: string | null
          auto_escalate_after_broken_promises?: number | null
          blocked_days?: string[] | null
          business_address?: Json | null
          business_email?: string | null
          business_phone?: string | null
          company_logo_url?: string | null
          company_name?: string
          contact_hours_end?: string | null
          contact_hours_start?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_floor_percentage?: number | null
          default_link_expiry_hours?: number | null
          id?: string
          industry?: string | null
          max_contacts_per_7_days?: number | null
          onboarding_complete?: boolean | null
          platform_fee_percentage?: number | null
          role?: string | null
          sendgrid_api_key?: string | null
          sendgrid_from_email?: string | null
          sendgrid_from_name?: string | null
          sendgrid_reply_to_email?: string | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          updated_at?: string | null
          vapi_api_key?: string | null
          vapi_assistant_id?: string | null
          voice_agent_name?: string | null
        }
        Relationships: []
      }
      contacts_log: {
        Row: {
          agreed_amount: number | null
          ai_response: string | null
          call_duration: number | null
          call_id: string | null
          call_outcome: string | null
          call_transcript: string | null
          channel: string
          company_id: string | null
          debtor_id: string | null
          direction: string
          id: string
          intent: string | null
          message: string | null
          payment_link_url: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          twilio_message_id: string | null
        }
        Insert: {
          agreed_amount?: number | null
          ai_response?: string | null
          call_duration?: number | null
          call_id?: string | null
          call_outcome?: string | null
          call_transcript?: string | null
          channel: string
          company_id?: string | null
          debtor_id?: string | null
          direction: string
          id?: string
          intent?: string | null
          message?: string | null
          payment_link_url?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          twilio_message_id?: string | null
        }
        Update: {
          agreed_amount?: number | null
          ai_response?: string | null
          call_duration?: number | null
          call_id?: string | null
          call_outcome?: string | null
          call_transcript?: string | null
          channel?: string
          company_id?: string | null
          debtor_id?: string | null
          direction?: string
          id?: string
          intent?: string | null
          message?: string | null
          payment_link_url?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          twilio_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_log_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      debtors: {
        Row: {
          account_ref: string | null
          amount: number
          broken_promise_count: number | null
          cease_desist: boolean | null
          company_id: string | null
          created_at: string | null
          current_negotiation_layer: number | null
          days_overdue: number | null
          email: string | null
          first_name: string | null
          floor_amount: number | null
          id: string
          import_job_id: string | null
          legal_threat_flag: boolean | null
          name: string
          phone: string | null
          status: string | null
          tier: number | null
          updated_at: string | null
        }
        Insert: {
          account_ref?: string | null
          amount: number
          broken_promise_count?: number | null
          cease_desist?: boolean | null
          company_id?: string | null
          created_at?: string | null
          current_negotiation_layer?: number | null
          days_overdue?: number | null
          email?: string | null
          first_name?: string | null
          floor_amount?: number | null
          id?: string
          import_job_id?: string | null
          legal_threat_flag?: boolean | null
          name: string
          phone?: string | null
          status?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Update: {
          account_ref?: string | null
          amount?: number
          broken_promise_count?: number | null
          cease_desist?: boolean | null
          company_id?: string | null
          created_at?: string | null
          current_negotiation_layer?: number | null
          days_overdue?: number | null
          email?: string | null
          first_name?: string | null
          floor_amount?: number | null
          id?: string
          import_job_id?: string | null
          legal_threat_flag?: boolean | null
          name?: string
          phone?: string | null
          status?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debtors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      human_queue: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          context: Json | null
          created_at: string | null
          debtor_id: string | null
          id: string
          reason: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          reason?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "human_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "human_queue_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          company_id: string | null
          created_at: string | null
          error_rows: number | null
          errors: Json | null
          filename: string | null
          id: string
          processed_rows: number | null
          status: string | null
          total_rows: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          error_rows?: number | null
          errors?: Json | null
          filename?: string | null
          id?: string
          processed_rows?: number | null
          status?: string | null
          total_rows?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          error_rows?: number | null
          errors?: Json | null
          filename?: string | null
          id?: string
          processed_rows?: number | null
          status?: string | null
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          currency: string | null
          debtor_id: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          status: string | null
          stripe_payment_link_id: string | null
          stripe_url: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          debtor_id?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          stripe_payment_link_id?: string | null
          stripe_url?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          debtor_id?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          stripe_payment_link_id?: string | null
          stripe_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      promises: {
        Row: {
          amount: number
          channel: string | null
          company_id: string | null
          created_at: string | null
          debtor_id: string | null
          id: string
          payment_link_id: string | null
          promised_date: string | null
          status: string | null
        }
        Insert: {
          amount: number
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          payment_link_id?: string | null
          promised_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          payment_link_id?: string | null
          promised_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promises_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promises_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_contacts: {
        Row: {
          channel: string
          company_id: string | null
          created_at: string | null
          debtor_id: string | null
          id: string
          layer: number | null
          message_template: string | null
          scheduled_for: string
          status: string | null
        }
        Insert: {
          channel: string
          company_id?: string | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          layer?: number | null
          message_template?: string | null
          scheduled_for: string
          status?: string | null
        }
        Update: {
          channel?: string
          company_id?: string | null
          created_at?: string | null
          debtor_id?: string | null
          id?: string
          layer?: number | null
          message_template?: string | null
          scheduled_for?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_contacts_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_numbers: {
        Row: {
          company_id: string | null
          created_at: string | null
          failure_count: number | null
          id: string
          label: string | null
          last_used: string | null
          phone_number: string
          status: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          label?: string | null
          last_used?: string | null
          phone_number: string
          status?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          failure_count?: number | null
          id?: string
          label?: string | null
          last_used?: string | null
          phone_number?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_numbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
        ]
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

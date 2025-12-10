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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      automated_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          workflow_rule_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workflow_rule_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workflow_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_tasks_workflow_rule_id_fkey"
            columns: ["workflow_rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_executions: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          current_step: number
          deal_id: string
          id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          deal_id: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          deal_id?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_executions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_executions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sequences: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_steps: {
        Row: {
          campaign_id: string
          channel: string
          content: string
          created_at: string
          delay_days: number
          id: string
          step_order: number
          subject: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          channel: string
          content: string
          created_at?: string
          delay_days?: number
          id?: string
          step_order: number
          subject?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          channel?: string
          content?: string
          created_at?: string
          delay_days?: number
          id?: string
          step_order?: number
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          city: string | null
          created_at: string
          date_moved_in: string | null
          date_moved_out: string | null
          id: string
          is_current: boolean | null
          postcode: string | null
          property_number: string | null
          street: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          date_moved_in?: string | null
          date_moved_out?: string | null
          id?: string
          is_current?: boolean | null
          postcode?: string | null
          property_number?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          date_moved_in?: string | null
          date_moved_out?: string | null
          id?: string
          is_current?: boolean | null
          postcode?: string | null
          property_number?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_car_leases: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          monthly_payment: number | null
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_credit_cards: {
        Row: {
          balance: number | null
          created_at: string
          credit_limit: number | null
          id: string
          monthly_payment: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          monthly_payment?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          monthly_payment?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_credit_history: {
        Row: {
          additional_notes: string | null
          arrears_details: string | null
          bankruptcy_date: string | null
          bankruptcy_discharge_date: string | null
          bankruptcy_discharged: boolean | null
          ccj_count: number | null
          ccj_details: string | null
          ccj_total_value: number | null
          created_at: string
          credit_report_date: string | null
          credit_score: number | null
          default_count: number | null
          default_details: string | null
          has_bankruptcy: boolean | null
          has_ccjs: boolean | null
          has_defaults: boolean | null
          has_iva: boolean | null
          has_mortgage_arrears: boolean | null
          has_repossession: boolean | null
          id: string
          iva_completed: boolean | null
          iva_completion_date: string | null
          iva_date: string | null
          repossession_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          arrears_details?: string | null
          bankruptcy_date?: string | null
          bankruptcy_discharge_date?: string | null
          bankruptcy_discharged?: boolean | null
          ccj_count?: number | null
          ccj_details?: string | null
          ccj_total_value?: number | null
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          default_count?: number | null
          default_details?: string | null
          has_bankruptcy?: boolean | null
          has_ccjs?: boolean | null
          has_defaults?: boolean | null
          has_iva?: boolean | null
          has_mortgage_arrears?: boolean | null
          has_repossession?: boolean | null
          id?: string
          iva_completed?: boolean | null
          iva_completion_date?: string | null
          iva_date?: string | null
          repossession_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          arrears_details?: string | null
          bankruptcy_date?: string | null
          bankruptcy_discharge_date?: string | null
          bankruptcy_discharged?: boolean | null
          ccj_count?: number | null
          ccj_details?: string | null
          ccj_total_value?: number | null
          created_at?: string
          credit_report_date?: string | null
          credit_score?: number | null
          default_count?: number | null
          default_details?: string | null
          has_bankruptcy?: boolean | null
          has_ccjs?: boolean | null
          has_defaults?: boolean | null
          has_iva?: boolean | null
          has_mortgage_arrears?: boolean | null
          has_repossession?: boolean | null
          id?: string
          iva_completed?: boolean | null
          iva_completion_date?: string | null
          iva_date?: string | null
          repossession_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          updated_at: string
          uploaded_at: string
          user_id: string
          verification_notes: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
          verification_notes?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          verification_notes?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      client_expenses: {
        Row: {
          childcare: number | null
          council_tax: number | null
          created_at: string
          groceries: number | null
          id: string
          insurance: number | null
          mortgage_rent: number | null
          other: number | null
          transport: number | null
          updated_at: string
          user_id: string
          utilities: number | null
        }
        Insert: {
          childcare?: number | null
          council_tax?: number | null
          created_at?: string
          groceries?: number | null
          id?: string
          insurance?: number | null
          mortgage_rent?: number | null
          other?: number | null
          transport?: number | null
          updated_at?: string
          user_id: string
          utilities?: number | null
        }
        Update: {
          childcare?: number | null
          council_tax?: number | null
          created_at?: string
          groceries?: number | null
          id?: string
          insurance?: number | null
          mortgage_rent?: number | null
          other?: number | null
          transport?: number | null
          updated_at?: string
          user_id?: string
          utilities?: number | null
        }
        Relationships: []
      }
      client_financial_assets: {
        Row: {
          bank_accounts: number | null
          created_at: string
          id: string
          investments: number | null
          other_assets: number | null
          pension_value: number | null
          property_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_accounts?: number | null
          created_at?: string
          id?: string
          investments?: number | null
          other_assets?: number | null
          pension_value?: number | null
          property_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_accounts?: number | null
          created_at?: string
          id?: string
          investments?: number | null
          other_assets?: number | null
          pension_value?: number | null
          property_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_income_streams: {
        Row: {
          annual_gross: number | null
          annual_income: number | null
          average_overtime: number | null
          benefit_amount: number | null
          benefit_type: string | null
          bonus: number | null
          business_address: string | null
          business_name: string | null
          business_type: string | null
          business_url: string | null
          contract_type: string | null
          created_at: string
          employer_address: string | null
          employer_name: string | null
          extras: number | null
          id: string
          income_type: string | null
          monthly_net: number | null
          other_amount: number | null
          other_description: string | null
          pension_amount: number | null
          pension_provider: string | null
          rental_income: number | null
          rental_properties: number | null
          start_date: string | null
          trading_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_gross?: number | null
          annual_income?: number | null
          average_overtime?: number | null
          benefit_amount?: number | null
          benefit_type?: string | null
          bonus?: number | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          business_url?: string | null
          contract_type?: string | null
          created_at?: string
          employer_address?: string | null
          employer_name?: string | null
          extras?: number | null
          id?: string
          income_type?: string | null
          monthly_net?: number | null
          other_amount?: number | null
          other_description?: string | null
          pension_amount?: number | null
          pension_provider?: string | null
          rental_income?: number | null
          rental_properties?: number | null
          start_date?: string | null
          trading_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_gross?: number | null
          annual_income?: number | null
          average_overtime?: number | null
          benefit_amount?: number | null
          benefit_type?: string | null
          bonus?: number | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          business_url?: string | null
          contract_type?: string | null
          created_at?: string
          employer_address?: string | null
          employer_name?: string | null
          extras?: number | null
          id?: string
          income_type?: string | null
          monthly_net?: number | null
          other_amount?: number | null
          other_description?: string | null
          pension_amount?: number | null
          pension_provider?: string | null
          rental_income?: number | null
          rental_properties?: number | null
          start_date?: string | null
          trading_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_mortgages: {
        Row: {
          balance: number | null
          created_at: string
          end_of_deal: string | null
          end_of_mortgage: string | null
          id: string
          interest_rate: number | null
          lender: string | null
          monthly_payment: number | null
          rate_type: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          end_of_deal?: string | null
          end_of_mortgage?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          monthly_payment?: number | null
          rate_type?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          end_of_deal?: string | null
          end_of_mortgage?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          monthly_payment?: number | null
          rate_type?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_other_debts: {
        Row: {
          balance: number | null
          created_at: string
          debt_type: string | null
          id: string
          lender: string | null
          monthly_payment: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          debt_type?: string | null
          id?: string
          lender?: string | null
          monthly_payment?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          debt_type?: string | null
          id?: string
          lender?: string | null
          monthly_payment?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_personal_details: {
        Row: {
          created_at: string
          dependent_ages: string | null
          dependents: number | null
          dob: string | null
          id: string
          marital_status: string | null
          nationality: string | null
          ni_number: string | null
          residence: string | null
          title: string | null
          updated_at: string
          user_id: string
          visa_expiry: string | null
          visa_type: string | null
        }
        Insert: {
          created_at?: string
          dependent_ages?: string | null
          dependents?: number | null
          dob?: string | null
          id?: string
          marital_status?: string | null
          nationality?: string | null
          ni_number?: string | null
          residence?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          visa_expiry?: string | null
          visa_type?: string | null
        }
        Update: {
          created_at?: string
          dependent_ages?: string | null
          dependents?: number | null
          dob?: string | null
          id?: string
          marital_status?: string | null
          nationality?: string | null
          ni_number?: string | null
          residence?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visa_expiry?: string | null
          visa_type?: string | null
        }
        Relationships: []
      }
      client_personal_loans: {
        Row: {
          balance: number | null
          created_at: string
          end_date: string | null
          id: string
          interest_rate: number | null
          lender: string | null
          monthly_payment: number | null
          rate_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          monthly_payment?: number | null
          rate_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          monthly_payment?: number | null
          rate_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          communication_type: string
          content: string | null
          created_at: string
          deal_id: string
          direction: string
          duration_seconds: number | null
          email_address: string | null
          id: string
          phone_number: string | null
          status: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          communication_type: string
          content?: string | null
          created_at?: string
          deal_id: string
          direction: string
          duration_seconds?: number | null
          email_address?: string | null
          id?: string
          phone_number?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          communication_type?: string
          content?: string | null
          created_at?: string
          deal_id?: string
          direction?: string
          duration_seconds?: number | null
          email_address?: string | null
          id?: string
          phone_number?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activity_logs: {
        Row: {
          action: string
          created_at: string
          deal_id: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          deal_id: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activity_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_participants: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          deal_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          deal_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          deal_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          created_at: string
          created_by_user_id: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["deal_status"]
          type: Database["public"]["Enums"]["loan_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["deal_status"]
          type: Database["public"]["Enums"]["loan_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["deal_status"]
          type?: Database["public"]["Enums"]["loan_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deal_id: string
          id: string
          sender: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          deal_id: string
          id?: string
          sender: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          deal_id?: string
          id?: string
          sender?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_messages: boolean
          created_at: string
          deal_status_updates: boolean
          document_requests: boolean
          email_enabled: boolean
          id: string
          idle_deal_alerts: boolean
          marketing_emails: boolean
          sms_enabled: boolean
          task_notifications: boolean
          updated_at: string
          user_id: string
          workflow_notifications: boolean
        }
        Insert: {
          campaign_messages?: boolean
          created_at?: string
          deal_status_updates?: boolean
          document_requests?: boolean
          email_enabled?: boolean
          id?: string
          idle_deal_alerts?: boolean
          marketing_emails?: boolean
          sms_enabled?: boolean
          task_notifications?: boolean
          updated_at?: string
          user_id: string
          workflow_notifications?: boolean
        }
        Update: {
          campaign_messages?: boolean
          created_at?: string
          deal_status_updates?: boolean
          document_requests?: boolean
          email_enabled?: boolean
          id?: string
          idle_deal_alerts?: boolean
          marketing_emails?: boolean
          sms_enabled?: boolean
          task_notifications?: boolean
          updated_at?: string
          user_id?: string
          workflow_notifications?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_deal_id: string | null
          related_task_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_deal_id?: string | null
          related_task_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_deal_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "automated_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          assigned_broker: string | null
          avatar_url: string | null
          created_at: string
          deal_code: string | null
          email: string
          first_name: string | null
          google_drive_folder_id: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          assigned_broker?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_code?: string | null
          email: string
          first_name?: string | null
          google_drive_folder_id?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string | null
          assigned_broker?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_code?: string | null
          email?: string
          first_name?: string | null
          google_drive_folder_id?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      requirement_documents: {
        Row: {
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          google_drive_file_id: string | null
          id: string
          mime_type: string
          requirement_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          deal_id: string
          file_name: string
          file_path: string
          file_size: number
          google_drive_file_id?: string | null
          id?: string
          mime_type: string
          requirement_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          deal_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          google_drive_file_id?: string | null
          id?: string
          mime_type?: string
          requirement_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_requirement_documents_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_documents_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          category: string | null
          created_at: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_callbacks: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string | null
          id: string
          notes: string | null
          reminder_10m_sent: boolean | null
          reminder_1h_sent: boolean | null
          reminder_24h_sent: boolean | null
          scheduled_at: string
          scheduled_by: string
          scheduled_with: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          reminder_10m_sent?: boolean | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          scheduled_at: string
          scheduled_by: string
          scheduled_with: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          reminder_10m_sent?: boolean | null
          reminder_1h_sent?: boolean | null
          reminder_24h_sent?: boolean | null
          scheduled_at?: string
          scheduled_by?: string
          scheduled_with?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_callbacks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          client_email: string | null
          client_first_name: string | null
          client_last_name: string | null
          created_at: string
          created_by: string
          deal_code: string | null
          expires_at: string
          id: string
          invitation_code: string
          last_email_sent_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          secure_token: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          created_at?: string
          created_by: string
          deal_code?: string | null
          expires_at: string
          id?: string
          invitation_code: string
          last_email_sent_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          secure_token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          client_email?: string | null
          client_first_name?: string | null
          client_last_name?: string | null
          created_at?: string
          created_by?: string
          deal_code?: string | null
          expires_at?: string
          id?: string
          invitation_code?: string
          last_email_sent_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          secure_token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          sms_enabled: boolean | null
          sms_phone_number: string | null
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          sms_enabled?: boolean | null
          sms_phone_number?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          sms_enabled?: boolean | null
          sms_phone_number?: string | null
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          actions_executed: Json | null
          deal_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          status: string | null
          trigger_data: Json | null
          workflow_rule_id: string
        }
        Insert: {
          actions_executed?: Json | null
          deal_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string | null
          trigger_data?: Json | null
          workflow_rule_id: string
        }
        Update: {
          actions_executed?: Json | null
          deal_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          status?: string | null
          trigger_data?: Json | null
          workflow_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_rule_id_fkey"
            columns: ["workflow_rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_deal: {
        Args: { _deal_id: string; _user_id: string }
        Returns: boolean
      }
      check_idle_deals: { Args: never; Returns: undefined }
      generate_deal_code: { Args: { broker_initials: string }; Returns: string }
      generate_invitation_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_deal_status: {
        Args: { p_deal_id: string; p_new_status: string }
        Returns: undefined
      }
      validate_invitation_token: {
        Args: { _token: string }
        Returns: {
          client_email: string
          client_first_name: string
          client_last_name: string
          created_by: string
          deal_code: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
    }
    Enums: {
      app_role: "client" | "team_member" | "admin" | "super_admin" | "broker"
      deal_status:
        | "new_case"
        | "awaiting_dip"
        | "dip_approved"
        | "reports_instructed"
        | "final_underwriting"
        | "offered"
        | "with_solicitors"
        | "completed"
      loan_type:
        | "bridging"
        | "mortgage"
        | "development"
        | "business"
        | "factoring"
        | "asset"
        | "mca"
        | "equity"
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
      app_role: ["client", "team_member", "admin", "super_admin", "broker"],
      deal_status: [
        "new_case",
        "awaiting_dip",
        "dip_approved",
        "reports_instructed",
        "final_underwriting",
        "offered",
        "with_solicitors",
        "completed",
      ],
      loan_type: [
        "bridging",
        "mortgage",
        "development",
        "business",
        "factoring",
        "asset",
        "mca",
        "equity",
      ],
    },
  },
} as const

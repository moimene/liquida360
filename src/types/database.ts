// Auto-generated types from Supabase - replace with `supabase gen types typescript`
// Manually flattened Insert/Update types for tsc -b compatibility

export type Database = {
  public: {
    Tables: {
      correspondents: {
        Row: {
          id: string
          name: string
          country: string
          tax_id: string
          address: string
          email: string | null
          phone: string | null
          status: 'active' | 'inactive' | 'pending_approval'
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          country: string
          tax_id: string
          address: string
          email?: string | null
          phone?: string | null
          status?: 'active' | 'inactive' | 'pending_approval'
          user_id?: string | null
        }
        Update: {
          name?: string
          country?: string
          tax_id?: string
          address?: string
          email?: string | null
          phone?: string | null
          status?: 'active' | 'inactive' | 'pending_approval'
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          correspondent_id: string
          issuing_country: string
          issue_date: string
          expiry_date: string
          document_url: string | null
          status: 'valid' | 'expiring_soon' | 'expired'
          apostilled: boolean
          apostille_requirement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          correspondent_id: string
          issuing_country: string
          issue_date: string
          expiry_date: string
          document_url?: string | null
          status?: 'valid' | 'expiring_soon' | 'expired'
          apostilled?: boolean
          apostille_requirement?: string | null
        }
        Update: {
          correspondent_id?: string
          issuing_country?: string
          issue_date?: string
          expiry_date?: string
          document_url?: string | null
          status?: 'valid' | 'expiring_soon' | 'expired'
          apostilled?: boolean
          apostille_requirement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'certificates_correspondent_id_fkey'
            columns: ['correspondent_id']
            isOneToOne: false
            referencedRelation: 'correspondents'
            referencedColumns: ['id']
          },
        ]
      }
      liquidations: {
        Row: {
          id: string
          correspondent_id: string
          certificate_id: string | null
          amount: number
          currency: string
          concept: string
          reference: string | null
          invoice_url: string | null
          status:
            | 'draft'
            | 'pending_approval'
            | 'approved'
            | 'payment_requested'
            | 'paid'
            | 'rejected'
          created_by: string
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          correspondent_id: string
          certificate_id?: string | null
          amount: number
          currency?: string
          concept: string
          reference?: string | null
          invoice_url?: string | null
          status?:
            | 'draft'
            | 'pending_approval'
            | 'approved'
            | 'payment_requested'
            | 'paid'
            | 'rejected'
          created_by: string
          approved_by?: string | null
        }
        Update: {
          correspondent_id?: string
          certificate_id?: string | null
          amount?: number
          currency?: string
          concept?: string
          reference?: string | null
          invoice_url?: string | null
          status?:
            | 'draft'
            | 'pending_approval'
            | 'approved'
            | 'payment_requested'
            | 'paid'
            | 'rejected'
          created_by?: string
          approved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'liquidations_correspondent_id_fkey'
            columns: ['correspondent_id']
            isOneToOne: false
            referencedRelation: 'correspondents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'liquidations_certificate_id_fkey'
            columns: ['certificate_id']
            isOneToOne: false
            referencedRelation: 'certificates'
            referencedColumns: ['id']
          },
        ]
      }
      payment_requests: {
        Row: {
          id: string
          liquidation_id: string
          status: 'pending' | 'in_progress' | 'paid' | 'rejected'
          requested_at: string
          processed_at: string | null
          processed_by: string | null
          payment_proof_url: string | null
          notes: string | null
        }
        Insert: {
          liquidation_id: string
          status?: 'pending' | 'in_progress' | 'paid' | 'rejected'
          processed_at?: string | null
          processed_by?: string | null
          payment_proof_url?: string | null
          notes?: string | null
        }
        Update: {
          liquidation_id?: string
          status?: 'pending' | 'in_progress' | 'paid' | 'rejected'
          processed_at?: string | null
          processed_by?: string | null
          payment_proof_url?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_requests_liquidation_id_fkey'
            columns: ['liquidation_id']
            isOneToOne: false
            referencedRelation: 'liquidations'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          related_entity_type: string | null
          related_entity_id: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          title: string
          message: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          read?: boolean
          read_at?: string | null
        }
        Update: {
          user_id?: string
          type?: string
          title?: string
          message?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          read?: boolean
          read_at?: string | null
        }
        Relationships: []
      }
      alert_configs: {
        Row: {
          id: string
          alert_type: string
          days_before_expiry: number
          enabled: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          days_before_expiry: number
          enabled?: boolean
          created_by: string
        }
        Update: {
          alert_type?: string
          days_before_expiry?: number
          enabled?: boolean
          created_by?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_data: Record<string, unknown> | null
          new_data: Record<string, unknown> | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          user_id?: string | null
        }
        Update: {
          table_name?: string
          record_id?: string
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: string
          correspondent_id: string | null
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          correspondent_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          correspondent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_correspondent_id_fkey'
            columns: ['correspondent_id']
            isOneToOne: false
            referencedRelation: 'correspondents'
            referencedColumns: ['id']
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          title: string | null
          is_group: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          title?: string | null
          is_group?: boolean
          created_by: string
        }
        Update: {
          title?: string | null
          is_group?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          last_read_at?: string
        }
        Update: {
          last_read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          sender_id: string
          content: string
        }
        Update: {
          content?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

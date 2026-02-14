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
          bank_account_holder: string | null
          bank_account_iban: string | null
          bank_swift_bic: string | null
          bank_certificate_url: string | null
          bank_data_updated_at: string | null
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
          bank_account_holder?: string | null
          bank_account_iban?: string | null
          bank_swift_bic?: string | null
          bank_certificate_url?: string | null
          bank_data_updated_at?: string | null
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
          bank_account_holder?: string | null
          bank_account_iban?: string | null
          bank_swift_bic?: string | null
          bank_certificate_url?: string | null
          bank_data_updated_at?: string | null
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
          certificate_type: 'residence' | 'withholding' | 'bank_account'
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
          certificate_type?: 'residence' | 'withholding' | 'bank_account'
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
          certificate_type?: 'residence' | 'withholding' | 'bank_account'
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
      // ==========================================
      // G-Invoice domain tables
      // ==========================================
      ginv_jobs: {
        Row: {
          id: string
          job_code: string
          client_code: string
          client_name: string
          client_country: string
          uttai_status: 'clear' | 'blocked' | 'pending_review'
          uttai_subject_obliged: boolean | null
          owner_user_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          job_code: string
          client_code: string
          client_name: string
          client_country?: string
          uttai_status?: 'clear' | 'blocked' | 'pending_review'
          uttai_subject_obliged?: boolean | null
          owner_user_id?: string | null
          status?: string
        }
        Update: {
          job_code?: string
          client_code?: string
          client_name?: string
          client_country?: string
          uttai_status?: 'clear' | 'blocked' | 'pending_review'
          uttai_subject_obliged?: boolean | null
          owner_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      ginv_vendors: {
        Row: {
          id: string
          name: string
          tax_id: string
          country: string
          compliance_status: 'compliant' | 'expiring_soon' | 'non_compliant'
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          tax_id: string
          country: string
          compliance_status?: 'compliant' | 'expiring_soon' | 'non_compliant'
        }
        Update: {
          name?: string
          tax_id?: string
          country?: string
          compliance_status?: 'compliant' | 'expiring_soon' | 'non_compliant'
        }
        Relationships: []
      }
      ginv_vendor_documents: {
        Row: {
          id: string
          vendor_id: string
          doc_type: 'tax_residency_certificate' | 'partners_letter' | 'other'
          issued_at: string | null
          expires_at: string | null
          status: 'compliant' | 'expiring_soon' | 'non_compliant'
          file_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          vendor_id: string
          doc_type: 'tax_residency_certificate' | 'partners_letter' | 'other'
          issued_at?: string | null
          expires_at?: string | null
          status?: 'compliant' | 'expiring_soon' | 'non_compliant'
          file_path?: string | null
        }
        Update: {
          vendor_id?: string
          doc_type?: 'tax_residency_certificate' | 'partners_letter' | 'other'
          issued_at?: string | null
          expires_at?: string | null
          status?: 'compliant' | 'expiring_soon' | 'non_compliant'
          file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_vendor_documents_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'ginv_vendors'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_intake_items: {
        Row: {
          id: string
          type: 'vendor_invoice' | 'official_fee'
          vendor_id: string | null
          job_id: string | null
          currency: string
          amount: number
          amount_eur: number | null
          exchange_rate_to_eur: number | null
          invoice_number: string | null
          nrc_number: string | null
          invoice_date: string | null
          concept_text: string | null
          official_organism: string | null
          tariff_type: string | null
          approver_user_id: string | null
          uttai_status_snapshot: 'clear' | 'blocked' | 'pending_review' | null
          vendor_compliance_snapshot: 'compliant' | 'expiring_soon' | 'non_compliant' | null
          file_path: string | null
          status:
            | 'draft'
            | 'submitted'
            | 'needs_info'
            | 'pending_approval'
            | 'approved'
            | 'rejected'
            | 'sent_to_accounting'
            | 'posted'
            | 'ready_to_bill'
            | 'billed'
            | 'archived'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          type: 'vendor_invoice' | 'official_fee'
          vendor_id?: string | null
          job_id?: string | null
          currency?: string
          amount: number
          amount_eur?: number | null
          exchange_rate_to_eur?: number | null
          invoice_number?: string | null
          nrc_number?: string | null
          invoice_date?: string | null
          concept_text?: string | null
          official_organism?: string | null
          tariff_type?: string | null
          approver_user_id?: string | null
          uttai_status_snapshot?: 'clear' | 'blocked' | 'pending_review' | null
          vendor_compliance_snapshot?: 'compliant' | 'expiring_soon' | 'non_compliant' | null
          file_path?: string | null
          status?:
            | 'draft'
            | 'submitted'
            | 'needs_info'
            | 'pending_approval'
            | 'approved'
            | 'rejected'
            | 'sent_to_accounting'
            | 'posted'
            | 'ready_to_bill'
            | 'billed'
            | 'archived'
          created_by: string
        }
        Update: {
          type?: 'vendor_invoice' | 'official_fee'
          vendor_id?: string | null
          job_id?: string | null
          currency?: string
          amount?: number
          amount_eur?: number | null
          exchange_rate_to_eur?: number | null
          invoice_number?: string | null
          nrc_number?: string | null
          invoice_date?: string | null
          concept_text?: string | null
          official_organism?: string | null
          tariff_type?: string | null
          approver_user_id?: string | null
          uttai_status_snapshot?: 'clear' | 'blocked' | 'pending_review' | null
          vendor_compliance_snapshot?: 'compliant' | 'expiring_soon' | 'non_compliant' | null
          file_path?: string | null
          status?:
            | 'draft'
            | 'submitted'
            | 'needs_info'
            | 'pending_approval'
            | 'approved'
            | 'rejected'
            | 'sent_to_accounting'
            | 'posted'
            | 'ready_to_bill'
            | 'billed'
            | 'archived'
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_intake_items_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'ginv_vendors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ginv_intake_items_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'ginv_jobs'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_sap_postings: {
        Row: {
          id: string
          intake_item_id: string
          sap_reference: string
          posted_at: string
          posted_by: string
          notes: string | null
          created_at: string
        }
        Insert: {
          intake_item_id: string
          sap_reference: string
          posted_at: string
          posted_by: string
          notes?: string | null
        }
        Update: {
          intake_item_id?: string
          sap_reference?: string
          posted_at?: string
          posted_by?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_sap_postings_intake_item_id_fkey'
            columns: ['intake_item_id']
            isOneToOne: false
            referencedRelation: 'ginv_intake_items'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_billing_batches: {
        Row: {
          id: string
          job_id: string
          status: string
          uttai_subject_obliged: boolean | null
          total_amount: number | null
          total_fees: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          job_id: string
          status?: string
          uttai_subject_obliged?: boolean | null
          total_amount?: number | null
          total_fees?: number | null
          created_by: string
        }
        Update: {
          job_id?: string
          status?: string
          uttai_subject_obliged?: boolean | null
          total_amount?: number | null
          total_fees?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_billing_batches_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'ginv_jobs'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_billing_batch_items: {
        Row: {
          id: string
          batch_id: string
          intake_item_id: string
          attach_fee: boolean
          decision: 'emit' | 'transfer' | 'discard' | null
          created_at: string
        }
        Insert: {
          batch_id: string
          intake_item_id: string
          attach_fee?: boolean
          decision?: 'emit' | 'transfer' | 'discard' | null
        }
        Update: {
          batch_id?: string
          intake_item_id?: string
          attach_fee?: boolean
          decision?: 'emit' | 'transfer' | 'discard' | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_billing_batch_items_batch_id_fkey'
            columns: ['batch_id']
            isOneToOne: false
            referencedRelation: 'ginv_billing_batches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ginv_billing_batch_items_intake_item_id_fkey'
            columns: ['intake_item_id']
            isOneToOne: false
            referencedRelation: 'ginv_intake_items'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_client_invoices: {
        Row: {
          id: string
          batch_id: string | null
          sap_invoice_number: string | null
          sap_invoice_date: string | null
          pdf_file_path: string | null
          sap_payload: Record<string, unknown>
          collection_status: 'pending' | 'partially_paid' | 'paid'
          due_date: string | null
          amount_due_eur: number | null
          amount_paid_eur: number
          paid_at: string | null
          status:
            | 'invoice_draft'
            | 'pending_partner_approval'
            | 'ready_for_sap'
            | 'issued'
            | 'delivered'
            | 'platform_required'
            | 'platform_completed'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          sap_invoice_number?: string | null
          sap_invoice_date?: string | null
          pdf_file_path?: string | null
          sap_payload?: Record<string, unknown>
          collection_status?: 'pending' | 'partially_paid' | 'paid'
          due_date?: string | null
          amount_due_eur?: number | null
          amount_paid_eur?: number
          paid_at?: string | null
          status?:
            | 'invoice_draft'
            | 'pending_partner_approval'
            | 'ready_for_sap'
            | 'issued'
            | 'delivered'
            | 'platform_required'
            | 'platform_completed'
          created_by: string
        }
        Update: {
          batch_id?: string | null
          sap_invoice_number?: string | null
          sap_invoice_date?: string | null
          pdf_file_path?: string | null
          sap_payload?: Record<string, unknown>
          collection_status?: 'pending' | 'partially_paid' | 'paid'
          due_date?: string | null
          amount_due_eur?: number | null
          amount_paid_eur?: number
          paid_at?: string | null
          status?:
            | 'invoice_draft'
            | 'pending_partner_approval'
            | 'ready_for_sap'
            | 'issued'
            | 'delivered'
            | 'platform_required'
            | 'platform_completed'
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_client_invoices_batch_id_fkey'
            columns: ['batch_id']
            isOneToOne: false
            referencedRelation: 'ginv_billing_batches'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_collection_claims: {
        Row: {
          id: string
          client_invoice_id: string
          job_id: string | null
          status: 'pending_approval' | 'approved' | 'rejected' | 'sent'
          subject: string
          body: string
          recipients: Record<string, unknown>[]
          cc_recipients: Record<string, unknown>[]
          responsible_recipients: Record<string, unknown>[]
          approval_notes: string | null
          created_by: string
          approved_by: string | null
          approved_at: string | null
          rejected_by: string | null
          rejected_at: string | null
          sent_by: string | null
          sent_at: string | null
          delivery_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          client_invoice_id: string
          job_id?: string | null
          status?: 'pending_approval' | 'approved' | 'rejected' | 'sent'
          subject: string
          body: string
          recipients?: Record<string, unknown>[]
          cc_recipients?: Record<string, unknown>[]
          responsible_recipients?: Record<string, unknown>[]
          approval_notes?: string | null
          created_by: string
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          sent_by?: string | null
          sent_at?: string | null
          delivery_id?: string | null
        }
        Update: {
          client_invoice_id?: string
          job_id?: string | null
          status?: 'pending_approval' | 'approved' | 'rejected' | 'sent'
          subject?: string
          body?: string
          recipients?: Record<string, unknown>[]
          cc_recipients?: Record<string, unknown>[]
          responsible_recipients?: Record<string, unknown>[]
          approval_notes?: string | null
          created_by?: string
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          sent_by?: string | null
          sent_at?: string | null
          delivery_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_collection_claims_client_invoice_id_fkey'
            columns: ['client_invoice_id']
            isOneToOne: false
            referencedRelation: 'ginv_client_invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ginv_collection_claims_delivery_id_fkey'
            columns: ['delivery_id']
            isOneToOne: false
            referencedRelation: 'ginv_deliveries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ginv_collection_claims_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'ginv_jobs'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_deliveries: {
        Row: {
          id: string
          client_invoice_id: string
          delivery_type: string
          recipients: Record<string, unknown>[]
          subject: string | null
          body: string | null
          attachments: Record<string, unknown>[] | null
          status: string
          sent_at: string | null
          sent_by: string | null
          created_at: string
        }
        Insert: {
          client_invoice_id: string
          delivery_type?: string
          recipients?: Record<string, unknown>[]
          subject?: string | null
          body?: string | null
          attachments?: Record<string, unknown>[] | null
          status?: string
          sent_at?: string | null
          sent_by?: string | null
        }
        Update: {
          client_invoice_id?: string
          delivery_type?: string
          recipients?: Record<string, unknown>[]
          subject?: string | null
          body?: string | null
          attachments?: Record<string, unknown>[] | null
          status?: string
          sent_at?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_deliveries_client_invoice_id_fkey'
            columns: ['client_invoice_id']
            isOneToOne: false
            referencedRelation: 'ginv_client_invoices'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_platform_tasks: {
        Row: {
          id: string
          client_invoice_id: string
          platform_name: string
          client_platform_code: string | null
          invoice_number: string | null
          order_number: string | null
          notes: string | null
          evidence_file_path: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'blocked'
          assigned_to: string | null
          sla_due_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          client_invoice_id: string
          platform_name: string
          client_platform_code?: string | null
          invoice_number?: string | null
          order_number?: string | null
          notes?: string | null
          evidence_file_path?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          assigned_to?: string | null
          sla_due_at?: string | null
        }
        Update: {
          client_invoice_id?: string
          platform_name?: string
          client_platform_code?: string | null
          invoice_number?: string | null
          order_number?: string | null
          notes?: string | null
          evidence_file_path?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          assigned_to?: string | null
          sla_due_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_platform_tasks_client_invoice_id_fkey'
            columns: ['client_invoice_id']
            isOneToOne: false
            referencedRelation: 'ginv_client_invoices'
            referencedColumns: ['id']
          },
        ]
      }
      ginv_uttai_requests: {
        Row: {
          id: string
          job_id: string
          requested_by: string
          status: string
          resolved_by: string | null
          resolved_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          job_id: string
          requested_by: string
          status?: string
          notes?: string | null
        }
        Update: {
          status?: string
          resolved_by?: string | null
          resolved_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ginv_uttai_requests_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'ginv_jobs'
            referencedColumns: ['id']
          },
        ]
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Supabase auto-generated schema
    Views: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Supabase auto-generated schema
    Functions: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Supabase auto-generated schema
    Enums: {}
  }
}

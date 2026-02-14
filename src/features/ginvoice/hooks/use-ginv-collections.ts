import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { GInvClientInvoice, GInvCollectionClaim } from '@/types'
import { buildCollectionSnapshot, type CollectionBucket } from '../lib/collections'

export interface CollectionContact {
  name: string
  email: string
}

export interface CollectionInvoice extends GInvClientInvoice {
  job_id: string | null
  job_code: string | null
  client_name: string | null
  client_country: string | null
  responsible_contacts: CollectionContact[]
  bucket: CollectionBucket
  days_overdue: number
  due_date_resolved: string | null
  amount_due_eur_resolved: number | null
  outstanding_eur: number | null
}

export interface CollectionClaimView extends GInvCollectionClaim {
  job_code: string | null
  client_name: string | null
  sap_invoice_number: string | null
  recipient_count: number
  cc_count: number
  responsible_count: number
}

interface CreateCollectionClaimParams {
  clientInvoiceId: string
  jobId: string | null
  subject: string
  body: string
  recipients: CollectionContact[]
  ccRecipients: CollectionContact[]
  responsibleRecipients: CollectionContact[]
  createdBy: string
}

interface GInvCollectionsState {
  invoices: CollectionInvoice[]
  claims: CollectionClaimView[]
  loading: boolean
  claimsLoading: boolean
  error: string | null
  claimsError: string | null
  fetchCollections: () => Promise<void>
  fetchClaims: () => Promise<void>
  createClaim: (params: CreateCollectionClaimParams) => Promise<{ data?: CollectionClaimView; error?: string }>
  approveClaim: (claimId: string, approvedBy: string, notes?: string) => Promise<{ error?: string }>
  rejectClaim: (claimId: string, rejectedBy: string, notes?: string) => Promise<{ error?: string }>
  sendClaim: (claimId: string, sentBy: string) => Promise<{ error?: string }>
  markAsPaid: (invoiceId: string) => Promise<{ error?: string }>
}

interface BatchJobRow {
  id: string
  job_id: string | null
}

interface JobRow {
  id: string
  job_code: string
  client_name: string
  client_country: string | null
  owner_user_id: string | null
}

interface ProfileRow {
  id: string
  email: string
  full_name: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseContacts(raw: Record<string, unknown>[] | null | undefined): CollectionContact[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      const email = typeof entry.email === 'string' ? entry.email.trim() : ''
      if (!email) return null
      const name = typeof entry.name === 'string' ? entry.name.trim() : ''
      return {
        name: name || email,
        email,
      } satisfies CollectionContact
    })
    .filter((entry): entry is CollectionContact => entry !== null)
}

function toContactRecords(contacts: CollectionContact[]): Record<string, unknown>[] {
  const unique = new Map<string, CollectionContact>()
  contacts.forEach((contact) => {
    const email = normalizeEmail(contact.email)
    if (!email) return
    if (!unique.has(email)) {
      unique.set(email, {
        name: contact.name.trim() || email,
        email,
      })
    }
  })
  return Array.from(unique.values()).map((contact) => ({
    name: contact.name,
    email: contact.email,
  }))
}

function mergeDeliveryRecipients(
  recipients: CollectionContact[],
  ccRecipients: CollectionContact[],
  responsibleRecipients: CollectionContact[],
): Record<string, unknown>[] {
  const toMap = new Map<string, CollectionContact>()
  recipients.forEach((contact) => {
    const email = normalizeEmail(contact.email)
    if (!email) return
    if (!toMap.has(email)) {
      toMap.set(email, { name: contact.name || email, email })
    }
  })

  const ccMap = new Map<string, CollectionContact>()
  ;[...ccRecipients, ...responsibleRecipients].forEach((contact) => {
    const email = normalizeEmail(contact.email)
    if (!email || toMap.has(email)) return
    if (!ccMap.has(email)) {
      ccMap.set(email, { name: contact.name || email, email })
    }
  })

  return [
    ...Array.from(toMap.values()).map((contact) => ({
      name: contact.name,
      email: contact.email,
      type: 'to',
    })),
    ...Array.from(ccMap.values()).map((contact) => ({
      name: contact.name,
      email: contact.email,
      type: 'cc',
    })),
  ]
}

function hydrateClaimRow(claim: GInvCollectionClaim, invoices: CollectionInvoice[]): CollectionClaimView {
  const invoice = invoices.find((row) => row.id === claim.client_invoice_id)
  const recipients = parseContacts(claim.recipients)
  const ccRecipients = parseContacts(claim.cc_recipients)
  const responsibleRecipients = parseContacts(claim.responsible_recipients)

  return {
    ...claim,
    job_code: invoice?.job_code ?? null,
    client_name: invoice?.client_name ?? null,
    sap_invoice_number: invoice?.sap_invoice_number ?? null,
    recipient_count: recipients.length,
    cc_count: ccRecipients.length,
    responsible_count: responsibleRecipients.length,
  }
}

export const useGInvCollections = create<GInvCollectionsState>((set, get) => ({
  invoices: [],
  claims: [],
  loading: false,
  claimsLoading: false,
  error: null,
  claimsError: null,

  fetchCollections: async () => {
    set({ loading: true, error: null })

    const [invoicesRes, batchesRes, jobsRes] = await Promise.all([
      supabase
        .from('ginv_client_invoices')
        .select('*')
        .not('sap_invoice_number', 'is', null)
        .order('sap_invoice_date', { ascending: false, nullsFirst: false }),
      supabase.from('ginv_billing_batches').select('id,job_id'),
      supabase.from('ginv_jobs').select('id,job_code,client_name,client_country,owner_user_id'),
    ])

    if (invoicesRes.error) {
      set({ error: invoicesRes.error.message, loading: false })
      return
    }
    if (batchesRes.error) {
      set({ error: batchesRes.error.message, loading: false })
      return
    }
    if (jobsRes.error) {
      set({ error: jobsRes.error.message, loading: false })
      return
    }

    const batches = (batchesRes.data ?? []) as BatchJobRow[]
    const jobs = (jobsRes.data ?? []) as JobRow[]
    const jobIdByBatchId = new Map(batches.map((batch) => [batch.id, batch.job_id]))
    const jobById = new Map(jobs.map((job) => [job.id, job]))
    const ownerIds = Array.from(
      new Set(
        jobs
          .map((job) => job.owner_user_id)
          .filter((ownerId): ownerId is string => Boolean(ownerId)),
      ),
    )
    const { data: profileRows, error: profilesError } = ownerIds.length === 0
      ? { data: [], error: null }
      : await supabase
        .from('user_profiles')
        .select('id,email,full_name')
        .in('id', ownerIds)

    if (profilesError) {
      set({ error: profilesError.message, loading: false })
      return
    }
    const profiles = (profileRows ?? []) as ProfileRow[]
    const profileByUserId = new Map(profiles.map((profile) => [profile.id, profile]))

    const rows = (invoicesRes.data ?? []).map((invoice) => {
      const jobId = invoice.batch_id ? jobIdByBatchId.get(invoice.batch_id) : null
      const job = jobId ? jobById.get(jobId) : undefined
      const ownerProfile = job?.owner_user_id ? profileByUserId.get(job.owner_user_id) : undefined
      const snapshot = buildCollectionSnapshot(invoice)
      return {
        ...invoice,
        job_id: jobId ?? null,
        job_code: job?.job_code ?? null,
        client_name: job?.client_name ?? null,
        client_country: job?.client_country ?? null,
        responsible_contacts: ownerProfile
          ? [{ name: ownerProfile.full_name || ownerProfile.email, email: ownerProfile.email }]
          : [],
        bucket: snapshot.bucket,
        days_overdue: snapshot.daysOverdue,
        due_date_resolved: snapshot.dueDate,
        amount_due_eur_resolved: snapshot.amountDueEur,
        outstanding_eur: snapshot.outstandingEur,
      } satisfies CollectionInvoice
    })

    set({
      invoices: rows,
      claims: get().claims.map((claim) => hydrateClaimRow(claim, rows)),
      loading: false,
    })
  },

  fetchClaims: async () => {
    set({ claimsLoading: true, claimsError: null })
    const { data, error } = await supabase
      .from('ginv_collection_claims')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      set({ claimsError: error.message, claimsLoading: false })
      return
    }

    const hydrated = (data ?? []).map((claim) => hydrateClaimRow(claim, get().invoices))
    set({ claims: hydrated, claimsLoading: false })
  },

  createClaim: async (params) => {
    const payload = {
      client_invoice_id: params.clientInvoiceId,
      job_id: params.jobId,
      status: 'pending_approval' as const,
      subject: params.subject,
      body: params.body,
      recipients: toContactRecords(params.recipients),
      cc_recipients: toContactRecords(params.ccRecipients),
      responsible_recipients: toContactRecords(params.responsibleRecipients),
      created_by: params.createdBy,
      approval_notes: null,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      sent_by: null,
      sent_at: null,
      delivery_id: null,
    }

    const { data, error } = await supabase
      .from('ginv_collection_claims')
      .insert(payload)
      .select()
      .single()

    if (error) return { error: error.message }
    const hydrated = hydrateClaimRow(data, get().invoices)
    set({ claims: [hydrated, ...get().claims] })
    return { data: hydrated }
  },

  approveClaim: async (claimId, approvedBy, notes) => {
    const { data, error } = await supabase
      .from('ginv_collection_claims')
      .update({
        status: 'approved',
        approval_notes: notes ?? null,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        rejected_by: null,
        rejected_at: null,
      })
      .eq('id', claimId)
      .select()
      .single()

    if (error) return { error: error.message }
    const hydrated = hydrateClaimRow(data, get().invoices)
    set({ claims: get().claims.map((claim) => (claim.id === claimId ? hydrated : claim)) })
    return {}
  },

  rejectClaim: async (claimId, rejectedBy, notes) => {
    const { data, error } = await supabase
      .from('ginv_collection_claims')
      .update({
        status: 'rejected',
        approval_notes: notes ?? null,
        rejected_by: rejectedBy,
        rejected_at: new Date().toISOString(),
        approved_by: null,
        approved_at: null,
        sent_by: null,
        sent_at: null,
      })
      .eq('id', claimId)
      .select()
      .single()

    if (error) return { error: error.message }
    const hydrated = hydrateClaimRow(data, get().invoices)
    set({ claims: get().claims.map((claim) => (claim.id === claimId ? hydrated : claim)) })
    return {}
  },

  sendClaim: async (claimId, sentBy) => {
    const claim = get().claims.find((row) => row.id === claimId)
    if (!claim) return { error: 'Reclamación no encontrada' }
    if (claim.status !== 'approved') {
      return { error: 'La reclamación debe estar aprobada antes de enviarse' }
    }

    const recipients = parseContacts(claim.recipients)
    const ccRecipients = parseContacts(claim.cc_recipients)
    const responsibleRecipients = parseContacts(claim.responsible_recipients)
    if (recipients.length === 0) {
      return { error: 'Añade al menos un destinatario principal antes de enviar' }
    }

    const deliveryRecipients = mergeDeliveryRecipients(recipients, ccRecipients, responsibleRecipients)
    const sentAt = new Date().toISOString()
    const { data: delivery, error: deliveryError } = await supabase
      .from('ginv_deliveries')
      .insert({
        client_invoice_id: claim.client_invoice_id,
        delivery_type: 'collection_claim',
        recipients: deliveryRecipients,
        subject: claim.subject,
        body: claim.body,
        attachments: [],
        status: 'sent',
        sent_by: sentBy,
        sent_at: sentAt,
      })
      .select()
      .single()

    if (deliveryError) return { error: deliveryError.message }

    const { data, error } = await supabase
      .from('ginv_collection_claims')
      .update({
        status: 'sent',
        sent_by: sentBy,
        sent_at: sentAt,
        delivery_id: delivery.id,
      })
      .eq('id', claimId)
      .select()
      .single()

    if (error) return { error: error.message }
    const hydrated = hydrateClaimRow(data, get().invoices)
    set({ claims: get().claims.map((row) => (row.id === claimId ? hydrated : row)) })
    return {}
  },

  markAsPaid: async (invoiceId) => {
    const invoice = get().invoices.find((row) => row.id === invoiceId)
    if (!invoice) return { error: 'Factura no encontrada' }

    const amountPaid = invoice.amount_due_eur_resolved ?? invoice.amount_paid_eur ?? 0
    const { data, error } = await supabase
      .from('ginv_client_invoices')
      .update({
        collection_status: 'paid',
        amount_paid_eur: amountPaid,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) return { error: error.message }

    const snapshot = buildCollectionSnapshot(data)
    set({
      invoices: get().invoices.map((row) =>
        row.id === invoiceId
          ? {
            ...row,
            ...data,
            bucket: snapshot.bucket,
            days_overdue: snapshot.daysOverdue,
            due_date_resolved: snapshot.dueDate,
            amount_due_eur_resolved: snapshot.amountDueEur,
            outstanding_eur: snapshot.outstandingEur,
          }
          : row,
      ),
    })
    return {}
  },
}))

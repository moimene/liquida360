// supabase/functions/manage-users/index.ts
// Edge Function: CRUD for internal user management (admin only)
//
// Deploy: supabase functions deploy manage-users
//
// Actions (via POST body):
//   { action: "list" }                             → List all users with roles
//   { action: "invite", email, role }              → Invite a new internal user (sends email)
//   { action: "update_role", userId, role }        → Change user role
//   { action: "approve_user", userId, role }       → Approve a pending internal user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INTERNAL_ROLES = ['pagador', 'supervisor', 'financiero', 'admin']

interface ManageUsersPayload {
  action: 'list' | 'invite' | 'update_role' | 'approve_user'
  email?: string
  role?: string
  userId?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: caller },
    } = await supabaseAdmin.auth.getUser(token)

    if (!caller || caller.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: ManageUsersPayload = await req.json()

    // -----------------------------------------------
    // ACTION: list — List all users with roles
    // -----------------------------------------------
    if (payload.action === 'list') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 200,
      })

      if (error) {
        throw new Error(`Failed to list users: ${error.message}`)
      }

      // Map to clean format, include all users
      const mapped = users.map((u) => ({
        id: u.id,
        email: u.email ?? '',
        role: (u.app_metadata?.role as string) ?? null,
        correspondent_id: (u.app_metadata?.correspondent_id as string) ?? null,
        requested_role: (u.user_metadata?.requested_role as string) ?? null,
        full_name: (u.user_metadata?.full_name as string) ?? null,
        created_at: u.created_at,
      }))

      return new Response(JSON.stringify({ users: mapped }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // -----------------------------------------------
    // ACTION: invite — Invite a new internal user
    // Uses inviteUserByEmail to send a real email,
    // then sets the role in app_metadata.
    // Falls back to createUser + generateLink if invite fails.
    // -----------------------------------------------
    if (payload.action === 'invite') {
      const { email, role } = payload

      if (!email || !role) {
        return new Response(JSON.stringify({ error: 'email and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!INTERNAL_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Must be one of: ${INTERNAL_ROLES.join(', ')}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      // Strategy: try inviteUserByEmail first (sends real email),
      // then set role via updateUserById. If that fails, fallback
      // to createUser + generateLink (admin shares link manually).
      let userId: string | null = null
      let magicLink: string | null = null
      let emailSent = false

      // Attempt 1: inviteUserByEmail (sends email automatically)
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { invited_role: role },
          redirectTo: `${req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? ''}/auth/callback`,
        })

      if (!inviteError && inviteData?.user) {
        userId = inviteData.user.id
        emailSent = true

        // Set the role in app_metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { role },
        })
      } else {
        // Attempt 2: fallback to createUser + magic link
        console.warn('inviteUserByEmail failed, falling back to createUser:', inviteError?.message)

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          app_metadata: { role },
        })

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        userId = newUser.user.id

        // Generate magic link for password setup
        const { data: linkData } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
          })

        magicLink = linkData?.properties?.action_link ?? null
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          message: emailSent
            ? `Invitacion enviada por email a ${email} con rol ${role}`
            : `Usuario creado: ${email} con rol ${role}. Comparte el enlace de acceso manualmente.`,
          emailSent,
          magicLink,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // -----------------------------------------------
    // ACTION: update_role — Change a user's role
    // -----------------------------------------------
    if (payload.action === 'update_role') {
      const { userId, role } = payload

      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'userId and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!INTERNAL_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Must be one of: ${INTERNAL_ROLES.join(', ')}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      // Prevent admin from changing their own role
      if (userId === caller.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot change your own role' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      const { data: updatedUser, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { role },
        })

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: updatedUser.user.id,
          message: `Role updated to ${role}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // -----------------------------------------------
    // ACTION: approve_user — Approve a pending internal user
    // (user registered via self-registration with no role)
    // -----------------------------------------------
    if (payload.action === 'approve_user') {
      const { userId, role } = payload

      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'userId and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!INTERNAL_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role. Must be one of: ${INTERNAL_ROLES.join(', ')}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      // Verify the user exists and has no role yet
      const { data: { user: targetUser }, error: getUserError } =
        await supabaseAdmin.auth.admin.getUserById(userId)

      if (getUserError || !targetUser) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (targetUser.app_metadata?.role) {
        return new Response(
          JSON.stringify({ error: `User already has role: ${targetUser.app_metadata.role}` }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      // Assign the role
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { role },
        })

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          message: `User approved with role ${role}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('manage-users error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

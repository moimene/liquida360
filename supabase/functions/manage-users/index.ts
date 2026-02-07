// supabase/functions/manage-users/index.ts
// Edge Function: CRUD for internal user management (admin only)
//
// Deploy: supabase functions deploy manage-users
//
// Actions (via POST body):
//   { action: "list" }                         → List all internal users
//   { action: "invite", email, role }           → Create new internal user
//   { action: "update_role", userId, role }     → Change user role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INTERNAL_ROLES = ['pagador', 'supervisor', 'financiero', 'admin']

interface ManageUsersPayload {
  action: 'list' | 'invite' | 'update_role'
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
        created_at: u.created_at,
      }))

      return new Response(JSON.stringify({ users: mapped }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // -----------------------------------------------
    // ACTION: invite — Create a new internal user
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

      // Generate magic link for password setup
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
        })

      return new Response(
        JSON.stringify({
          success: true,
          userId: newUser.user.id,
          message: `User invited: ${email} with role ${role}`,
          magicLink: linkData?.properties?.action_link ?? null,
          linkError: linkError?.message ?? null,
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

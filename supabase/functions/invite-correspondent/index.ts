import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user: caller },
    } = await supabaseAdmin.auth.getUser(token)

    if (!caller || caller.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { correspondentId, email } = await req.json()

    if (!correspondentId || !email) {
      return new Response(JSON.stringify({ error: 'correspondentId and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Check correspondent exists and has no user_id yet
    const { data: correspondent, error: fetchError } = await supabaseAdmin
      .from('correspondents')
      .select('id, name, user_id')
      .eq('id', correspondentId)
      .single()

    if (fetchError || !correspondent) {
      return new Response(JSON.stringify({ error: 'Correspondent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (correspondent.user_id) {
      return new Response(
        JSON.stringify({ error: 'Correspondent already has a portal account' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 2. Create user with corresponsal role
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: {
        role: 'corresponsal',
        correspondent_id: correspondentId,
      },
      user_metadata: {
        correspondent_name: correspondent.name,
      },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Link user to correspondent
    const { error: updateError } = await supabaseAdmin
      .from('correspondents')
      .update({ user_id: newUser.user.id })
      .eq('id', correspondentId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Generate password reset link so correspondent can set their password
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: `Invitation sent to ${email}`,
        resetLink: linkData?.properties?.action_link ?? null,
        linkError: linkError?.message ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

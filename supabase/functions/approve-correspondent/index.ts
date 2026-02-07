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

    const { correspondentId } = await req.json()

    if (!correspondentId) {
      return new Response(JSON.stringify({ error: 'correspondentId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Fetch correspondent
    const { data: correspondent, error: fetchError } = await supabaseAdmin
      .from('correspondents')
      .select('id, name, user_id, status')
      .eq('id', correspondentId)
      .single()

    if (fetchError || !correspondent) {
      return new Response(JSON.stringify({ error: 'Correspondent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (correspondent.status !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: `Correspondent status is '${correspondent.status}', expected 'pending_approval'` }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!correspondent.user_id) {
      return new Response(JSON.stringify({ error: 'Correspondent has no linked user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Update correspondent status to active
    const { error: updateCorrespondentError } = await supabaseAdmin
      .from('correspondents')
      .update({ status: 'active' })
      .eq('id', correspondentId)

    if (updateCorrespondentError) {
      return new Response(JSON.stringify({ error: updateCorrespondentError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Set user app_metadata with role and correspondent_id
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      correspondent.user_id,
      {
        app_metadata: {
          role: 'corresponsal',
          correspondent_id: correspondentId,
        },
      },
    )

    if (updateUserError) {
      return new Response(JSON.stringify({ error: updateUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Correspondent '${correspondent.name}' approved successfully`,
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

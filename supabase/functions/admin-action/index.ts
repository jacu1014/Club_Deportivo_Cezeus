// supabase/functions/admin-action/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // FIX: buscar el token en múltiples headers posibles
    const authHeader =
      req.headers.get('Authorization') ||
      req.headers.get('authorization') ||
      `Bearer ${req.headers.get('apikey')}`;

    console.log('[admin-action] Auth header presente:', !!req.headers.get('Authorization'));
    console.log('[admin-action] Todos los headers:', JSON.stringify([...req.headers.entries()]));

    // Leer body primero para obtener el token si viene ahí
    const bodyText = await req.text();
    let body: any = {};
    try { body = JSON.parse(bodyText); } catch {}

    const { accion, datos, token } = body;
    console.log('[admin-action] Accion:', accion);

    // FIX: aceptar token del body como fallback
    const bearerToken = 
      req.headers.get('Authorization')?.replace('Bearer ', '') ||
      token;

    if (!bearerToken) {
      console.error('[admin-action] Sin token de autorización');
      return new Response(
        JSON.stringify({ error: 'No autorizado — sin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${bearerToken}` } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    console.log('[admin-action] Usuario válido:', !!user, authError?.message);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida: ' + authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (accion === 'crear-usuario') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email:         datos.email,
        password:      datos.password,
        email_confirm: true,
        user_metadata: datos.user_metadata || {},
      });
      console.log('[admin-action] crear-usuario resultado:', !!data?.user, error?.message);
      return new Response(
        JSON.stringify({ data, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (accion === 'eliminar-usuario') {
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(datos.userId);
      return new Response(
        JSON.stringify({ data, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (accion === 'actualizar-rol') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        datos.userId,
        { user_metadata: { rol: datos.rol } }
      );
      return new Response(
        JSON.stringify({ data, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no reconocida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[admin-action] ERROR:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
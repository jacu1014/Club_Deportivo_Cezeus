// supabase/functions/admin-action/index.ts
// FIX: se agregan headers CORS para permitir peticiones desde el dominio de producción

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {

  // Preflight CORS — el navegador lo envía antes de cada petición real
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verificar sesión activa
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validar token del usuario que llama
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Sesión inválida' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Cliente admin — SERVICE_ROLE_KEY solo vive aquí en el servidor
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { accion, datos } = await req.json();

  // Crear usuario
  if (accion === 'crear-usuario') {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email:         datos.email,
      password:      datos.password,
      email_confirm: true,
      user_metadata: datos.user_metadata || {},
    });
    return new Response(
      JSON.stringify({ data, error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Eliminar usuario
  if (accion === 'eliminar-usuario') {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(datos.userId);
    return new Response(
      JSON.stringify({ data, error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Actualizar rol
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
});
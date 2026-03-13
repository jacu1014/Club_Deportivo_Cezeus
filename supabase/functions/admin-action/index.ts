import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Verificar que viene con sesion activa
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Validar el token del usuario que llama
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Sesion invalida' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Cliente admin — SERVICE_ROLE_KEY solo vive aqui en el servidor
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { accion, datos } = await req.json()

  // Crear usuario (usado en ModalUsuario / StaffSection)
  if (accion === 'crear-usuario') {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: datos.email,
      password: datos.password,
      email_confirm: true,
      user_metadata: datos.user_metadata || {}
    })
    return Response.json({ data, error })
  }

  // Eliminar usuario
  if (accion === 'eliminar-usuario') {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(datos.userId)
    return Response.json({ data, error })
  }

  // Actualizar rol de usuario
  if (accion === 'actualizar-rol') {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      datos.userId,
      { user_metadata: { rol: datos.rol } }
    )
    return Response.json({ data, error })
  }

  return new Response(JSON.stringify({ error: 'Accion no reconocida' }), { 
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  })
})
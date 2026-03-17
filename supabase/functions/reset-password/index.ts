// supabase/functions/reset-password/index.ts
// Edge Function: envía correo de restablecimiento de contraseña via Resend.
//
// Secrets requeridos (mismos que enviar-contacto):
//   RESEND_API_KEY  → tu API key de resend.com
//   SITE_URL        → https://clubdeportivocezeus.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REMITENTE = 'Club Cezeus <noreply@clubdeportivocezeus.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: 'El correo es obligatorio.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar link de recuperación con el SDK admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type:    'recovery',
      email:   email.trim().toLowerCase(),
      options: {
        redirectTo: redirectTo || `${Deno.env.get('SITE_URL')}/reset-password`,
      },
    });

    if (error) throw new Error(error.message);

    const recoveryLink = data.properties?.action_link;
    if (!recoveryLink) throw new Error('No se pudo generar el enlace.');

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada.');

    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#05080d;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05080d;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0a1118;border-radius:20px;overflow:hidden;border:1px solid rgba(19,236,236,0.15);">

        <tr>
          <td style="background:linear-gradient(135deg,#0a1118,#0e1c2a);padding:36px 40px;border-bottom:1px solid rgba(19,236,236,0.1);">
            <h1 style="margin:0;color:#13ecec;font-size:22px;font-weight:900;text-transform:uppercase;">
              ⚽ Club Deportivo Cezeus
            </h1>
            <p style="margin:8px 0 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
              Restablecimiento de contraseña
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta
              en el portal del Club Cezeus. Haz clic en el botón para crear una nueva:
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${recoveryLink}"
                 style="display:inline-block;background:#13ecec;color:#05080d;padding:14px 40px;
                        border-radius:12px;font-size:14px;font-weight:900;text-decoration:none;
                        text-transform:uppercase;letter-spacing:0.08em;">
                Restablecer contraseña
              </a>
            </div>
            <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
              Este enlace expira en <strong style="color:#94a3b8;">1 hora</strong>.
              Si no solicitaste este cambio, ignora este correo.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0;color:#334155;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
              Club Deportivo Cezeus · Bogotá, Colombia
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    REMITENTE,
        to:      [email.trim().toLowerCase()],
        subject: '🔐 Restablece tu contraseña — Club Cezeus',
        html:    htmlEmail,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend ${resendRes.status}: ${errBody}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[reset-password]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
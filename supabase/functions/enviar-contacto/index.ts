// supabase/functions/enviar-contacto/index.ts
// Edge Function: guarda la solicitud en BD y envía correo via Resend.
//
// Secrets requeridos en Supabase → Settings → Edge Functions → Manage secrets:
//   RESEND_API_KEY  → tu API key de resend.com (empieza con re_)
//   SITE_URL        → https://clubdeportivocezeus.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REMITENTE    = 'Club Cezeus <noreply@clubdeportivocezeus.com>';
const COORDINADORES = [
  'cesarceballos830@gmail.com',
  'suo35@hotmail.com',
  'clubdeportivocezeus@gmail.com'
];

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { nombre, telefono, nombre_nino, edad, categoria, mensaje } = body;

    if (!nombre?.trim() || !telefono?.trim() || !nombre_nino?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 1. Guardar en Supabase ─────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: dbError } = await supabase
      .from('solicitudes_contacto')
      .insert([{ nombre, telefono, nombre_nino, edad: edad || null, categoria, mensaje }]);

    if (dbError) throw new Error(`DB: ${dbError.message}`);

    // ── 2. Enviar correo via Resend ────────────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada.');

    const fechaFormato = new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const htmlEmail = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05080d;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05080d;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a1118;border-radius:20px;overflow:hidden;border:1px solid rgba(19,236,236,0.15);">

        <tr>
          <td style="background:linear-gradient(135deg,#0a1118,#0e1c2a);padding:36px 40px;border-bottom:1px solid rgba(19,236,236,0.1);">
            <h1 style="margin:0;color:#13ecec;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;">
              ⚽ Club Deportivo Cezeus
            </h1>
            <p style="margin:8px 0 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
              Nueva solicitud de inscripción
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px 0;">
            <p style="margin:0;color:#475569;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
              📅 ${fechaFormato}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Padre / Madre</p>
                <p style="margin:0;color:#f1f5f9;font-size:16px;font-weight:700;">${nombre}</p>
              </td></tr>

              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Teléfono de contacto</p>
                <p style="margin:0;color:#13ecec;font-size:20px;font-weight:900;">${telefono}</p>
              </td></tr>

              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Nombre del niño/a</p>
                <p style="margin:0;color:#f1f5f9;font-size:16px;font-weight:700;">${nombre_nino}</p>
              </td></tr>

              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Edad</p>
                <p style="margin:0;color:#f1f5f9;font-size:16px;font-weight:700;">${edad ? edad + ' años' : 'No indicada'}</p>
              </td></tr>

              <tr><td style="padding:12px 0;border-bottom:${mensaje ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Categoría de interés</p>
                <p style="margin:0;color:#f1f5f9;font-size:16px;font-weight:700;">${categoria || 'No seleccionada'}</p>
              </td></tr>

              ${mensaje ? `
              <tr><td style="padding:12px 0;">
                <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Mensaje</p>
                <p style="margin:0;color:#cbd5e1;font-size:14px;font-style:italic;">"${mensaje}"</p>
              </td></tr>` : ''}

            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 36px;">
            <div style="background:rgba(19,236,236,0.05);border:1px solid rgba(19,236,236,0.15);border-radius:12px;padding:20px;text-align:center;">
              <p style="margin:0 0 12px;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
                Responder a este padre de familia
              </p>
              <a href="tel:${telefono}"
                 style="display:inline-block;background:#13ecec;color:#05080d;padding:12px 32px;border-radius:10px;
                        font-size:13px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;">
                📞 Llamar: ${telefono}
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0;color:#334155;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
              Club Deportivo Cezeus · Resolución 460 I.D.R.D. · Bogotá, Colombia
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
        to:      COORDINADORES,
        subject: `⚽ Nueva solicitud de inscripción — ${nombre_nino}`,
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
    console.error('[enviar-contacto]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
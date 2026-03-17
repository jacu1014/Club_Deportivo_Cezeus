import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REMITENTE    = 'Club Cezeus <noreply@clubdeportivocezeus.com>';
const COORDINADORES = [
  'cesarceballos830@gmail.com',
  'suo35@hotmail.com',
  'clubdeportivocezeus@gmail.com',
];

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log('[1] Inicio');
    const body = await req.json();
    const { nombre, telefono, nombre_nino, edad, categoria, mensaje } = body;
    console.log('[2] Payload recibido:', nombre, telefono, nombre_nino);

    if (!nombre?.trim() || !telefono?.trim() || !nombre_nino?.trim()) {
      return new Response(JSON.stringify({ error: 'Faltan campos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // BD
    console.log('[3] Guardando en BD...');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: dbError } = await supabase
      .from('solicitudes_contacto')
      .insert([{ nombre, telefono, nombre_nino, edad: edad || null, categoria, mensaje }]);
    if (dbError) { console.error('[3] Error BD:', dbError.message); throw new Error(`DB: ${dbError.message}`); }
    console.log('[4] BD OK');

    // Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    console.log('[5] Key presente:', !!resendKey, '| Primeros 6 chars:', resendKey?.substring(0, 6));
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada.');

    console.log('[6] Llamando Resend API...');
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    REMITENTE,
        to:      COORDINADORES,
        subject: `⚽ Nueva solicitud — ${nombre_nino}`,
        html:    `<h2>Nueva solicitud de inscripción</h2>
                  <p><b>Padre/Madre:</b> ${nombre}</p>
                  <p><b>Teléfono:</b> ${telefono}</p>
                  <p><b>Niño/a:</b> ${nombre_nino}</p>
                  <p><b>Edad:</b> ${edad || 'No indicada'}</p>
                  <p><b>Categoría:</b> ${categoria || 'No seleccionada'}</p>
                  ${mensaje ? `<p><b>Mensaje:</b> ${mensaje}</p>` : ''}`,
      }),
    });

    const resendBody = await resendRes.text();
    console.log('[7] Resend status:', resendRes.status);
    console.log('[8] Resend respuesta:', resendBody);

    if (!resendRes.ok) throw new Error(`Resend ${resendRes.status}: ${resendBody}`);

    console.log('[9] Todo OK - correo enviado');
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[ERROR FINAL]:', err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
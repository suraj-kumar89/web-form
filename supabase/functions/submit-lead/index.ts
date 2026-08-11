import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEY = Deno.env.get("SUPABASE_SECRET_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_EMAIL = Deno.env.get("NOTIFICATION_EMAIL");
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") || "Bluvo Leads <leads@yourdomain.com>";
const SEND_CUSTOMER_EMAIL =
  (Deno.env.get("SEND_CUSTOMER_EMAIL") || "true").toLowerCase() === "true";

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
);

type LeadPayload = {
  submitted_at?: string;
  need?: string;
  goal?: string;
  stage?: string;
  channels?: string[];
  current_url?: string;
  problems?: string[];
  revenue?: string;
  platform?: string;
  page_for?: string;
  ad_spend?: string;
  page_count?: string;
  budget?: string;
  timeline?: string;
  company?: string;
  notes?: string;
  name?: string;
  phone?: string;
  email?: string;
  lead_score?: number;
  lead_band?: string;
  time_to_complete_sec?: number;

  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  wbraid?: string;
  gbraid?: string;
  referrer?: string;
  landing_page?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(value?: string[]) {
  return Array.isArray(value) && value.length
    ? value.map(escapeHtml).join(", ")
    : "—";
}

function row(label: string, value: unknown) {
  return `
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;width:190px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5e7eb;color:#111827;">
        ${escapeHtml(value || "—")}
      </td>
    </tr>
  `;
}

async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string,
) {
  if (!RESEND_API_KEY) {
    console.warn("[Bluvo] RESEND_API_KEY is not configured.");
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Bluvo] Resend error:", data);
    return { ok: false, skipped: false, data };
  }

  return { ok: true, skipped: false, data };
}

function adminEmailHtml(lead: LeadPayload, leadId: string) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:760px;margin:30px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <div style="padding:24px 28px;background:#07101b;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8fbfff;">
          Bluvo Studio · New Website Lead
        </div>
        <h1 style="margin:8px 0 0;font-size:26px;">${escapeHtml(lead.name)}</h1>
        <p style="margin:6px 0 0;color:#cbd5e1;">
          ${escapeHtml(lead.company)} · ${escapeHtml(lead.lead_band)}
        </p>
      </div>

      <div style="padding:24px 28px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
          <div style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:10px;">
            <strong>Score:</strong> ${escapeHtml(lead.lead_score)}
          </div>
          <div style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:10px;">
            <strong>Budget:</strong> ${escapeHtml(lead.budget)}
          </div>
          <div style="padding:10px 14px;border:1px solid #e5e7eb;border-radius:10px;">
            <strong>Phone:</strong> ${escapeHtml(lead.phone)}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${row("Project", lead.need)}
          ${row("Goal", lead.goal)}
          ${row("Business stage", lead.stage)}
          ${row("Traffic sources", list(lead.channels))}
          ${row("Current site", lead.current_url)}
          ${row("Problems", list(lead.problems))}
          ${row("Revenue", lead.revenue)}
          ${row("Platform", lead.platform)}
          ${row("Page purpose", lead.page_for)}
          ${row("Ad spend", lead.ad_spend)}
          ${row("Page count", lead.page_count)}
          ${row("Budget", lead.budget)}
          ${row("Timeline", lead.timeline)}
          ${row("Company", lead.company)}
          ${row("Name", lead.name)}
          ${row("WhatsApp", lead.phone)}
          ${row("Email", lead.email)}
          ${row("Notes", lead.notes)}
          ${row("Lead score", lead.lead_score)}
          ${row("Lead band", lead.lead_band)}
          ${row("Completed in", `${lead.time_to_complete_sec ?? "—"} seconds`)}
          ${row("UTM source", lead.utm_source)}
          ${row("UTM medium", lead.utm_medium)}
          ${row("UTM campaign", lead.utm_campaign)}
          ${row("UTM term", lead.utm_term)}
          ${row("UTM content", lead.utm_content)}
          ${row("GCLID", lead.gclid)}
          ${row("FBCLID", lead.fbclid)}
          ${row("Referrer", lead.referrer)}
          ${row("Landing page", lead.landing_page)}
          ${row("Lead ID", leadId)}
        </table>

        <div style="margin-top:24px;">
          <a
            href="https://wa.me/${encodeURIComponent((lead.phone || "").replace(/\D/g, ""))}"
            style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:9px;"
          >
            WhatsApp lead
          </a>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function customerEmailHtml(lead: LeadPayload) {
  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:30px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:30px;">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;">
        Bluvo Studio
      </div>
      <h1 style="font-size:28px;margin:12px 0 8px;">
        Thanks, ${escapeHtml((lead.name || "there").split(" ")[0])}.
      </h1>
      <p style="font-size:16px;line-height:1.6;color:#4b5563;">
        We’ve received your website project details. We’ll review your business,
        site and requirements before getting back to you.
      </p>

      <div style="margin:24px 0;padding:18px;background:#f8fafc;border-radius:12px;">
        <strong>Project:</strong> ${escapeHtml(lead.need)}<br/>
        <strong>Company:</strong> ${escapeHtml(lead.company)}<br/>
        <strong>Budget:</strong> ${escapeHtml(lead.budget)}<br/>
        <strong>Timeline:</strong> ${escapeHtml(lead.timeline)}
      </div>

      <p style="font-size:15px;line-height:1.6;color:#4b5563;">
        We’ll message you on WhatsApp to pin down scope and confirm whether
        we’re the right fit.
      </p>

      <p style="margin-top:30px;color:#6b7280;">
        — Bluvo Studio<br/>
        <a href="mailto:hello@bluvo.studio">hello@bluvo.studio</a>
      </p>
    </div>
  </body>
</html>`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405);
  }

  try {
    const lead = (await request.json()) as LeadPayload;

    if (!lead.name || lead.name.trim().length < 2) {
      return json({ success: false, message: "Name is required." }, 400);
    }

    if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
      return json({ success: false, message: "Valid email is required." }, 400);
    }

    if (!lead.phone || !/^\+91[6-9]\d{9}$/.test(lead.phone)) {
      return json(
        { success: false, message: "Valid Indian phone number is required." },
        400,
      );
    }

    if (!lead.need || !lead.budget || !lead.lead_band) {
      return json(
        { success: false, message: "Required lead fields are missing." },
        400,
      );
    }

    const { data: insertedLead, error: insertError } = await supabaseAdmin
      .from("website_leads")
      .insert({
        submitted_at: lead.submitted_at || new Date().toISOString(),
        need: lead.need || null,
        goal: lead.goal || null,
        stage: lead.stage || null,
        channels: lead.channels || [],
        current_url: lead.current_url || null,
        problems: lead.problems || [],
        revenue: lead.revenue || null,
        platform: lead.platform || null,
        page_for: lead.page_for || null,
        ad_spend: lead.ad_spend || null,
        page_count: lead.page_count || null,
        budget: lead.budget || null,
        timeline: lead.timeline || null,
        company: lead.company || null,
        notes: lead.notes || null,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        lead_score: lead.lead_score || 0,
        lead_band: lead.lead_band,
        time_to_complete_sec: lead.time_to_complete_sec || null,
        utm_source: lead.utm_source || null,
        utm_medium: lead.utm_medium || null,
        utm_campaign: lead.utm_campaign || null,
        utm_term: lead.utm_term || null,
        utm_content: lead.utm_content || null,
        gclid: lead.gclid || null,
        fbclid: lead.fbclid || null,
        wbraid: lead.wbraid || null,
        gbraid: lead.gbraid || null,
        referrer: lead.referrer || null,
        landing_page: lead.landing_page || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[Bluvo] Supabase insert error:", insertError);
      return json(
        { success: false, message: "Could not save the lead." },
        500,
      );
    }

    const leadId = insertedLead.id;

    let adminEmail = { ok: false, skipped: true };
    let customerEmail = { ok: false, skipped: true };

    if (RESEND_API_KEY && NOTIFICATION_EMAIL) {
      adminEmail = await sendEmail(
        NOTIFICATION_EMAIL,
        `${lead.lead_band} lead · ${lead.company || lead.name} · ${lead.budget}`,
        adminEmailHtml(lead, leadId),
        lead.email,
      );

      if (SEND_CUSTOMER_EMAIL && lead.email) {
        customerEmail = await sendEmail(
          lead.email,
          "We received your Bluvo project enquiry",
          customerEmailHtml(lead),
        );
      }
    } else {
      console.warn(
        "[Bluvo] Email not sent: RESEND_API_KEY or NOTIFICATION_EMAIL is missing.",
      );
    }

    return json({
      success: true,
      lead_id: leadId,
      email_sent: adminEmail.ok,
      customer_email_sent: customerEmail.ok,
    });
  } catch (error) {
    console.error("[Bluvo] submit-lead error:", error);
    return json(
      { success: false, message: "Unexpected server error." },
      500,
    );
  }
});

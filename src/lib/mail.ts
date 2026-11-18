import "server-only";
import nodemailer from "nodemailer";
type Contact = { name: string; email: string; company: string; body: string; locale: string };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BRAND = "#f03c1f";
// Table-based, inline-styled HTML: the only layout email clients render reliably.
function html(m: Contact) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:14px 0;border-bottom:1px solid #ececec;"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;margin-bottom:4px;">${label}</div><div style="font-size:16px;color:#111;">${value}</div></td></tr>`;
  const mail = esc(m.email);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f2f1ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ee;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<tr><td style="background:#0b0b0b;padding:28px 36px;"><span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#ffffff;">KAI</span><span style="display:inline-block;margin-left:8px;padding:2px 7px;background:${BRAND};color:#fff;font-size:16px;font-weight:700;border-radius:3px;">改</span><span style="margin-left:10px;font-size:12px;letter-spacing:3px;color:#9a9a9a;">STUDIO</span></td></tr>
<tr><td style="height:4px;background:${BRAND};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:36px 36px 8px;"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BRAND};font-weight:700;">New message</div><div style="font-size:26px;line-height:1.25;color:#111;font-weight:700;margin-top:8px;">${esc(m.name)} wrote to you</div></td></tr>
<tr><td style="padding:8px 36px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Name", esc(m.name))}${row("Email", `<a href="mailto:${mail}" style="color:${BRAND};text-decoration:none;">${mail}</a>`)}${m.company ? row("Company", esc(m.company)) : ""}
</table></td></tr>
<tr><td style="padding:24px 36px 8px;"><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8a8a;margin-bottom:10px;">Message</div><div style="background:#f7f6f3;border-left:4px solid ${BRAND};border-radius:6px;padding:18px 20px;font-size:16px;line-height:1.6;color:#222;white-space:pre-wrap;">${esc(m.body)}</div></td></tr>
<tr><td style="padding:28px 36px 36px;"><a href="mailto:${mail}?subject=${encodeURIComponent("Re: KAI STUDIO")}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">Reply to ${esc(m.name)}</a></td></tr>
<tr><td style="background:#0b0b0b;padding:18px 36px;font-size:12px;color:#8a8a8a;">Sent from the contact form at kaistudio.ge · ${esc(m.locale.toUpperCase())}</td></tr>
</table></td></tr></table></body></html>`;
}
// Contact-form notification over SMTP. Without SMTP_HOST/SMTP_USER/SMTP_PASS this is a no-op; the message is still stored.
export async function notifyContact(m: Contact) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;
  const port = Number(SMTP_PORT) || 465;
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
    });
    await transport.sendMail({
      from: `KAI STUDIO <${SMTP_USER}>`, to: MAIL_TO || SMTP_USER, replyTo: `${m.name.replace(/[<>"\r\n]/g, "")} <${m.email}>`,
      subject: `KAI STUDIO — ${m.name.replace(/[\r\n]/g, " ")}`,
      text: `Name: ${m.name}\nEmail: ${m.email}\nCompany: ${m.company || "-"}\nLanguage: ${m.locale}\n\n${m.body}`,
      html: html(m),
    });
  } catch (e) {
    console.error("contact mail failed", e);
  }
}

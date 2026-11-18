import "server-only";
import nodemailer from "nodemailer";
// Contact-form notification over SMTP. Without SMTP_HOST/SMTP_USER/SMTP_PASS this is a no-op; the message is still stored.
export async function notifyContact(m: { name: string; email: string; company: string; body: string; locale: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;
  const port = Number(SMTP_PORT) || 465;
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
    });
    await transport.sendMail({
      from: `KAI STUDIO <${SMTP_USER}>`, to: MAIL_TO || SMTP_USER, replyTo: `${m.name} <${m.email}>`,
      subject: `KAI STUDIO — ${m.name}`,
      text: `Name: ${m.name}\nEmail: ${m.email}\nCompany: ${m.company || "-"}\nLanguage: ${m.locale}\n\n${m.body}`,
    });
  } catch (e) {
    console.error("contact mail failed", e);
  }
}

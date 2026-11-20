import { emailConfigured, isProduction } from "./env";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends through Resend's HTTP API. Without RESEND_API_KEY (local development) the
 * message is printed to the server console instead, so sign-up still works offline.
 * Returns false when the mail could not be delivered.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!emailConfigured()) {
    if (isProduction()) {
      console.error("[email] RESEND_API_KEY/EMAIL_FROM not set — e-mail not sent");
      return false;
    }
    console.info(`\n[email:dev] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) console.error("[email] resend error", res.status, await res.text());
  return res.ok;
}

export function otpMail(to: string, code: string, purpose: "SIGNUP" | "RESET"): Mail {
  const what = purpose === "SIGNUP" ? "hesabınızı təsdiqləmək" : "şifrənizi yeniləmək";
  const text = `hobbi.az: ${what} üçün kodunuz ${code}\n\nKod 10 dəqiqə etibarlıdır. Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">
<p>hobbi.az: ${what} üçün kodunuz:</p>
<p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#e76262">${code}</p>
<p style="color:#666">Kod 10 dəqiqə etibarlıdır. Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın.</p></div>`;
  return { to, subject: `hobbi.az təsdiq kodu: ${code}`, text, html };
}

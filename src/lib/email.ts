// ============================================================================
// Email Service — Resend integration
// ============================================================================

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@onboarding.resend.dev";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    return resend;
  }
  return null;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("[EMAIL] No RESEND_API_KEY configured. Falling back to console log.");
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}

export function buildPasswordResetEmail(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <tr>
      <td style="text-align: center; padding: 24px 0;">
        <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">PropertyPro</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Unified Property Management</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Reset Your Password</h2>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset the password for your PropertyPro account. 
          Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding: 12px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
          If you didn't request a password reset, you can safely ignore this email.
          <br /><br />
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 8px 0 0 0;">
          ${resetLink}
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} PropertyPro. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
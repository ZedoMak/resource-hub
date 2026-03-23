import { Resend } from "resend";

const emailVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendVerificationEmailProps {
  email: string;
  url: string;
}

export const sendVerificationEmail = async ({ email, url }: SendVerificationEmailProps) => {
  if (!emailVerificationEnabled) {
    return;
  }

  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY not found in environment variables.");
    console.warn(`=> Verification link for ${email}: ${url}`);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: "ResourceHub <onboarding@resend.dev>", // Update this to a verified domain in production
      to: email,
      subject: "Verify your email address - ResourceHub",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; background-color: #fafafa; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
              .logo { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 24px; letter-spacing: -0.025em; }
              .title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
              .text { font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
              .button { display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 6px; text-decoration: none; text-align: center; }
              .footer { font-size: 14px; color: #9ca3af; margin-top: 32px; text-align: center; }
              .link { color: #4f46e5; word-break: break-all; margin-top: 16px; font-size: 14px; display: block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">ResourceHub.</div>
              <h1 class="title">Verify your email address</h1>
              <p class="text">Welcome to ResourceHub! To get started exploring, downloading, and contributing to the community, please verify your email address by clicking the button below.</p>
              <a href="${url}" class="button">Verify Email</a>
              <p class="text" style="margin-top: 24px;">Or copy and paste this link into your browser:</p>
              <a href="${url}" class="link">${url}</a>
              <div class="footer">
                If you didn't request this email, there's nothing to worry about — you can safely ignore it.
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✉️ Verification email sent to ${email}`, data);
    return data;
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    throw error;
  }
};

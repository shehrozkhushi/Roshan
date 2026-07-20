import nodemailer, { type Transporter } from "nodemailer";
import type { ContactSubmission } from "@/lib/contact-store";

type VerificationEmailInput = {
  to: string;
  name: string;
  code: string;
  locale: "en" | "ur";
};

let gmailTransporter: Transporter | undefined;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function withoutHeaderBreaks(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function getGmailConfig() {
  const user = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !password) {
    throw new Error("Gmail SMTP is not configured.");
  }

  return { user, password };
}

function getGmailTransporter() {
  const config = getGmailConfig();

  gmailTransporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return { transporter: gmailTransporter, user: config.user };
}

export async function sendVerificationEmail({
  to,
  name,
  code,
  locale,
}: VerificationEmailInput) {
  const { transporter, user } = getGmailTransporter();
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const isUrdu = locale === "ur";

  const subject = isUrdu
    ? "اپنا روشن اسٹوڈیو اکاؤنٹ تصدیق کریں"
    : "Verify your Roshan Studio account";
  const text = isUrdu
    ? `${name}، السلام علیکم\n\nاپنے روشن اسٹوڈیو اکاؤنٹ کی تصدیق کے لیے یہ کوڈ استعمال کریں:\n\n${code}\n\nیہ کوڈ 10 منٹ تک کارآمد ہے۔ اگر آپ نے یہ اکاؤنٹ نہیں بنایا تو اس ای میل کو نظر انداز کر دیں۔`
    : `Hi ${name},\n\nUse this code to verify your Roshan Studio account:\n\n${code}\n\nThis code expires in 10 minutes. If you did not create this account, you can ignore this email.`;
  const html = isUrdu
    ? `<!doctype html>
<html lang="ur" dir="rtl">
  <body style="margin:0;padding:32px;background:#f3f0e8;color:#121310;font-family:Tahoma,Arial,sans-serif;line-height:1.8">
    <div style="max-width:560px;margin:0 auto;padding:32px;background:#faf8f2;border:1px solid #d9d4c9">
      <h1 style="margin:0 0 24px;font-size:26px">اپنا اکاؤنٹ تصدیق کریں</h1>
      <p>${safeName}، السلام علیکم</p>
      <p>اپنے روشن اسٹوڈیو اکاؤنٹ کی تصدیق کے لیے یہ کوڈ استعمال کریں:</p>
      <p dir="ltr" style="margin:28px 0;font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center">${safeCode}</p>
      <p style="color:#62635d">یہ کوڈ 10 منٹ تک کارآمد ہے۔ اگر آپ نے یہ اکاؤنٹ نہیں بنایا تو اس ای میل کو نظر انداز کر دیں۔</p>
    </div>
  </body>
</html>`
    : `<!doctype html>
<html lang="en" dir="ltr">
  <body style="margin:0;padding:32px;background:#f3f0e8;color:#121310;font-family:Arial,sans-serif;line-height:1.6">
    <div style="max-width:560px;margin:0 auto;padding:32px;background:#faf8f2;border:1px solid #d9d4c9">
      <h1 style="margin:0 0 24px;font-size:26px">Verify your account</h1>
      <p>Hi ${safeName},</p>
      <p>Use this code to verify your Roshan Studio account:</p>
      <p style="margin:28px 0;font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center">${safeCode}</p>
      <p style="color:#62635d">This code expires in 10 minutes. If you did not create this account, you can ignore this email.</p>
    </div>
  </body>
</html>`;

  await transporter.sendMail({
    from: { name: "Roshan Studio", address: user },
    to,
    subject,
    text,
    html,
  });
}

export async function sendContactNotification(submission: ContactSubmission) {
  const { transporter, user } = getGmailTransporter();
  const recipient = process.env.CONTACT_TO_EMAIL?.trim() || user;
  const subjectName = withoutHeaderBreaks(submission.name);
  const optionalCompany = submission.company || "Not provided";
  const optionalBudget = submission.budget || "Not provided";
  const text = [
    "New Roshan Studio contact enquiry",
    "",
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Company: ${optionalCompany}`,
    `Service: ${submission.service}`,
    `Budget: ${optionalBudget}`,
    `Language: ${submission.locale}`,
    `Received: ${submission.createdAt}`,
    "",
    "Message:",
    submission.message,
  ].join("\n");
  const messageHtml = escapeHtml(submission.message).replace(/\r?\n/g, "<br>");
  const html = `<!doctype html>
<html lang="en" dir="ltr">
  <body style="margin:0;padding:32px;background:#f3f0e8;color:#121310;font-family:Arial,sans-serif;line-height:1.6">
    <div style="max-width:640px;margin:0 auto;padding:32px;background:#faf8f2;border:1px solid #d9d4c9">
      <h1 style="margin:0 0 24px;font-size:26px">New contact enquiry</h1>
      <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(optionalCompany)}</p>
      <p><strong>Service:</strong> ${escapeHtml(submission.service)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(optionalBudget)}</p>
      <p><strong>Language:</strong> ${escapeHtml(submission.locale)}</p>
      <p><strong>Received:</strong> ${escapeHtml(submission.createdAt)}</p>
      <hr style="margin:24px 0;border:0;border-top:1px solid #d9d4c9">
      <p><strong>Message</strong></p>
      <p>${messageHtml}</p>
    </div>
  </body>
</html>`;

  await transporter.sendMail({
    from: { name: "Roshan Studio", address: user },
    to: recipient,
    replyTo: {
      name: withoutHeaderBreaks(submission.name),
      address: submission.email,
    },
    subject: `New enquiry from ${subjectName || "website visitor"}`,
    text,
    html,
  });
}

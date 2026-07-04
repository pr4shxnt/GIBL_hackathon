import { defineTask } from "express-file-cluster/tasks";
import nodemailer from "nodemailer";

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

let transporter: nodemailer.Transporter;
const LOG_TAG = "[task/SendEmail]";

export default defineTask<SendEmailPayload>(async (payload) => {
  console.log(LOG_TAG, "task started", { to: payload.to, subject: payload.subject });

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      // port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(LOG_TAG, "transporter created", { host: process.env.SMTP_HOST });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      html: payload.body,
    });
    console.log(LOG_TAG, "email sent", { to: payload.to, messageId: info.messageId });
  } catch (err) {
    console.error(LOG_TAG, "email send failed", { to: payload.to }, err);
    throw err;
  }
});

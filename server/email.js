import nodemailer from "nodemailer";

let transporter;

export function getMailer() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
}

export async function sendSubscriptionEmail({ to, name, plan, endDate }) {
    const mailer = getMailer();
    const from = process.env.SMTP_FROM || "no-reply@newspaper-saas.local";
    const subject = "Subscription active - Online Newspaper";
    const text = `Hello ${name},\n\nYour ${plan} subscription is active until ${endDate}.\nYou can now download your newspapers from your dashboard.\n\nThanks,\nOnline Newspaper Team`;

    await mailer.sendMail({ from, to, subject, text });
}

'use strict';
/**
 * Optional e-mail notification for new inquiries.
 *
 * This is ONLY active when SMTP credentials are present in the server environment.
 * Credentials never reach the browser. When SMTP is not configured the function
 * returns { sent: false, reason: 'not_configured' } and the inquiry is still stored —
 * the API reports this honestly instead of pretending an e-mail was delivered.
 */
const REQUIRED = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO'];

function isConfigured() {
  return REQUIRED.every((key) => Boolean(process.env[key]));
}

async function sendInquiryNotification(inquiry) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };

  let nodemailer;
  try {
    // Loaded lazily so deployments without SMTP never touch the transport code.
    nodemailer = require('nodemailer');
  } catch {
    return { sent: false, reason: 'transport_unavailable' };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const price = `${inquiry.currency} ${inquiry.servicePrice.toLocaleString('en-PK')}`;
  const lines = [
    `New website inquiry — ${inquiry.reference}`,
    '',
    `Name:      ${inquiry.name}`,
    `Email:     ${inquiry.email}`,
    `Phone:     ${inquiry.phone}`,
    `Service:   ${inquiry.serviceName} (${price})`,
    `Received:  ${new Date().toISOString()}`,
    '',
    'Requirements:',
    inquiry.requirements,
  ].join('\n');

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO,
      replyTo: inquiry.email,
      subject: `New inquiry ${inquiry.reference} — ${inquiry.serviceName}`,
      text: lines,
    });
    return { sent: true };
  } catch (error) {
    console.error('[mailer] notification failed:', error.message);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = { isConfigured, sendInquiryNotification };

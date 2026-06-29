const nodemailer = require('nodemailer');

/**
 * Kontaktformular-Endpunkt (Vercel Serverless Function).
 * Versendet Formulareingaben per SMTP an die konfigurierte Zieladresse.
 *
 * Benötigte Environment-Variablen (Vercel → Settings → Environment Variables):
 *   SMTP_HOST   z. B. smtp.ionos.de / smtp.strato.de / mail.your-server.de
 *   SMTP_PORT   465 (SSL) oder 587 (STARTTLS)
 *   SMTP_USER   Postfach-Login (i. d. R. die volle E-Mail-Adresse)
 *   SMTP_PASS   Postfach-Passwort
 *   MAIL_FROM   (optional) Absenderadresse, sonst = SMTP_USER
 *   MAIL_TO     (optional) Empfänger, Standard: info@montage-objekte.de
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body || {};

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    const honeypot = String(body._gotcha || '').trim();

    // Spam-Bot im Honeypot gefangen → Erfolg vortäuschen, nichts senden
    if (honeypot) {
      res.status(200).json({ ok: true });
      return;
    }

    if (!name || !email || !message) {
      res.status(400).json({ ok: false, error: 'Bitte füllen Sie alle Pflichtfelder aus.' });
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      res.status(400).json({ ok: false, error: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
      return;
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.MAIL_TO || 'info@montage-objekte.de';
    const from = process.env.MAIL_FROM || user;

    if (!host || !user || !pass) {
      res.status(500).json({ ok: false, error: 'Der E-Mail-Versand ist serverseitig nicht konfiguriert.' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user, pass }
    });

    // Header-sichere Varianten (keine Zeilenumbrüche/Anführungszeichen in Headern)
    const safeName = name.replace(/["\r\n]/g, ' ').slice(0, 120);
    const subjectLine = `Kontaktanfrage Website${subject ? ' – ' + subject.replace(/[\r\n]/g, ' ') : ''} (${safeName})`;

    const text =
      'Neue Anfrage über das Kontaktformular:\n\n' +
      `Name: ${name}\n` +
      `E-Mail: ${email}\n` +
      `Bereich/Betreff: ${subject || '—'}\n\n` +
      `Nachricht:\n${message}\n`;

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
    const html =
      '<h2 style="font-family:Arial,sans-serif">Neue Anfrage über das Kontaktformular</h2>' +
      `<p style="font-family:Arial,sans-serif"><strong>Name:</strong> ${esc(name)}</p>` +
      `<p style="font-family:Arial,sans-serif"><strong>E-Mail:</strong> ${esc(email)}</p>` +
      `<p style="font-family:Arial,sans-serif"><strong>Bereich/Betreff:</strong> ${esc(subject || '—')}</p>` +
      `<p style="font-family:Arial,sans-serif"><strong>Nachricht:</strong><br/>${esc(message).replace(/\n/g, '<br/>')}</p>`;

    await transporter.sendMail({
      from: `"Website Kontaktformular" <${from}>`,
      to,
      replyTo: `"${safeName}" <${email}>`,
      subject: subjectLine,
      text,
      html
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Kontaktformular-Fehler:', err);
    res.status(500).json({ ok: false, error: 'Der Versand ist fehlgeschlagen. Bitte später erneut versuchen.' });
  }
};

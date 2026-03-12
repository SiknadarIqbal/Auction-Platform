import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getEmailConfig() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 0);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || user;

    const secure = port === 465;
    const requireTLS = port === 587;

    return { host, port, user, pass, from, secure, requireTLS };
}

function createTransporter() {
    const { host, port, user, pass, secure, requireTLS } = getEmailConfig();

    if (!host || !port || !user || !pass) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        requireTLS,
        tls: {
            rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true' ? true : false
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        connectionTimeout: 15_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000
    });
}

function getTransporter() {
    if (!cachedTransporter) cachedTransporter = createTransporter();
    return cachedTransporter;
}

function htmlToText(html) {
    if (!html) return '';
    return html
        .replace(/<\/(p|div|br|li|h\d)>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

const sendEmail = async (options) => {
    const cfg = getEmailConfig();
    const transporter = getTransporter();

    const to = options?.to || options?.email;
    const subject = options?.subject;
    const html = options?.html;
    const text = options?.text || options?.message || (html ? htmlToText(html) : '');

    const message = {
        from: options?.from || cfg.from,
        to,
        subject,
        text,
        html
    };

    const isDev = process.env.NODE_ENV === 'development';

    if (!to || !subject || (!text && !html)) {
        console.error('[email] Missing required fields', { to, subject, hasText: Boolean(text), hasHtml: Boolean(html) });
        return false;
    }

    if (!transporter) {
        if (isDev) {
            console.error('[email] Transporter not configured. Falling back to console output in development.');
            console.log('----------------------------------------------------');
            console.log(`TO: ${to}`);
            console.log(`SUBJECT: ${subject}`);
            console.log('TEXT:');
            console.log(text);
            if (html) {
                console.log('HTML:');
                console.log(html);
            }
            console.log('----------------------------------------------------');
            return true;
        }

        console.error('[email] Transporter not configured. Check EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD.');
        return false;
    }

    try {
        const info = await transporter.sendMail(message);
        console.log('[email] Sent', { messageId: info.messageId, to, host: cfg.host, port: cfg.port, secure: cfg.secure });
        return true;
    } catch (error) {
        console.error('[email] Send failed', {
            to,
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            code: error?.code,
            command: error?.command,
            response: error?.response,
            message: error?.message
        });

        if (isDev) {
            console.error('[email] Falling back to console output in development.');
            console.log('----------------------------------------------------');
            console.log(`TO: ${to}`);
            console.log(`SUBJECT: ${subject}`);
            console.log('TEXT:');
            console.log(text);
            if (html) {
                console.log('HTML:');
                console.log(html);
            }
            console.log('----------------------------------------------------');
            return true;
        }

        return false;
    }
};

export async function testTransporter(to = process.env.EMAIL_USER) {
    const subject = 'Hostinger SMTP test - Auction Platform';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
            <h2>SMTP test email</h2>
            <p>If you received this email, your Hostinger SMTP settings are working.</p>
            <p><b>Time:</b> ${new Date().toISOString()}</p>
        </div>
    `;
    return await sendEmail({ to, subject, html });
}

export default sendEmail;

import sendEmail from './sendEmail.js';

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const subject = 'Verify Your Email - Auction Platform';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Welcome to Auction Platform!</h2>
            <p>Please verify your email address to complete your registration.</p>
            <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
        </div>
    `;

    const ok = await sendEmail({ to: email, subject, html });

    if (!ok && process.env.NODE_ENV === 'development') {
        console.log('----------------------------------------------------');
        console.log('[DEV FALLBACK] Verification email failed. Use this link:');
        console.log(`TO: ${email}`);
        console.log(`LINK: ${verificationUrl}`);
        console.log('----------------------------------------------------');
        return true;
    }

    return ok;
};

export { sendVerificationEmail };

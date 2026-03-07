import nodemailer from 'nodemailer';

const sendVerificationEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Verify Your Email - Auction Platform',
            html: `
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
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);

        // Fallback for development: Log the link so developer can click it
        if (process.env.NODE_ENV === 'development') {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
            console.log("----------------------------------------------------");
            console.log(`[DEV FALBACK] Verification Email Failed. Use this link:`);
            console.log(`TO: ${email}`);
            console.log(`LINK: ${verificationUrl}`);
            console.log("----------------------------------------------------");
            return true; // Pretend it worked
        }

        return false;
    }
};

export { sendVerificationEmail };

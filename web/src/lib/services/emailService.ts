import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // For development, we'll use a test configuration
    // In production, you would use your email service credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email', // Ethereal for testing
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || '', // Your email credentials
        pass: process.env.EMAIL_PASS || '', // Your email password
      },
    })
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Restaurant Hiring App" <noreply@restaurant-hiring.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent successfully!')
        console.log('📧 Message ID:', info.messageId)
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      
      // For development, we'll still log the email content
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 Email that would have been sent:')
        console.log('To:', options.to)
        console.log('Subject:', options.subject)
        console.log('Content:', options.text || this.stripHtml(options.html))
        console.log('\n')
      }
      
      throw error
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset - Restaurant Hiring App</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">🍽️ Restaurant Hiring App</h1>
            
            <h2>Password Reset Request</h2>
            
            <p>Hello,</p>
            
            <p>You requested a password reset for your account. Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>
              The Restaurant Hiring App Team
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
Password Reset - Restaurant Hiring App

Hello,

You requested a password reset for your account. Visit this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Restaurant Hiring App Team
    `

    await this.sendEmail({
      to: email,
      subject: 'Reset your password - Restaurant Hiring App',
      html,
      text,
    })
  }

  async sendEmailVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - Restaurant Hiring App</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">🍽️ Restaurant Hiring App</h1>
            
            <h2>Welcome! Please verify your email</h2>
            
            <p>Hello,</p>
            
            <p>Thank you for signing up for Restaurant Hiring App! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create this account, you can safely ignore this email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>
              The Restaurant Hiring App Team
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
Welcome to Restaurant Hiring App!

Please verify your email address by visiting this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Best regards,
The Restaurant Hiring App Team
    `

    await this.sendEmail({
      to: email,
      subject: 'Verify your email - Restaurant Hiring App',
      html,
      text,
    })
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
}

export const emailService = new EmailService()
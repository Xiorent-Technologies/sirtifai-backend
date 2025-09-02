import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { EmailError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Email service
 * Handles sending emails for various purposes (verification, password reset, etc.)
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        secure: config.EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false, // For development only
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed', { error: error.message });
        } else {
          logger.info('Email transporter is ready to send messages');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error: error.message });
    }
  }

  /**
   * Send email
   * @param {Object} emailOptions - Email options
   * @returns {boolean} - Success status
   */
  async sendEmail(emailOptions) {
    try {
      if (!this.transporter) {
        throw new EmailError('Email transporter not initialized');
      }

      const defaultOptions = {
        from: config.EMAIL_FROM,
        ...emailOptions,
      };

      const info = await this.transporter.sendMail(defaultOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: emailOptions.to,
        subject: emailOptions.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', { 
        error: error.message, 
        to: emailOptions.to,
        subject: emailOptions.subject 
      });
      throw new EmailError('Failed to send email');
    }
  }

  /**
   * Send email verification email
   * @param {string} email - Recipient email
   * @param {string} token - Verification token
   * @returns {boolean} - Success status
   */
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const emailOptions = {
      to: email,
      subject: 'Verify Your Email Address',
      html: this.getVerificationEmailTemplate(verificationUrl),
      text: `Please verify your email address by clicking the following link: ${verificationUrl}`,
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} token - Password reset token
   * @returns {boolean} - Success status
   */
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${config.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const emailOptions = {
      to: email,
      subject: 'Reset Your Password',
      html: this.getPasswordResetEmailTemplate(resetUrl),
      text: `Please reset your password by clicking the following link: ${resetUrl}`,
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @returns {boolean} - Success status
   */
  async sendWelcomeEmail(email, firstName) {
    const emailOptions = {
      to: email,
      subject: 'Welcome to SirtifAI!',
      html: this.getWelcomeEmailTemplate(firstName),
      text: `Welcome to SirtifAI, ${firstName}! We're excited to have you on board.`,
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Send account suspension email
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} reason - Suspension reason
   * @returns {boolean} - Success status
   */
  async sendAccountSuspensionEmail(email, firstName, reason) {
    const emailOptions = {
      to: email,
      subject: 'Account Suspended',
      html: this.getAccountSuspensionEmailTemplate(firstName, reason),
      text: `Your account has been suspended. Reason: ${reason}`,
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Send password change notification email
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @returns {boolean} - Success status
   */
  async sendPasswordChangeNotification(email, firstName) {
    const emailOptions = {
      to: email,
      subject: 'Password Changed',
      html: this.getPasswordChangeNotificationTemplate(firstName),
      text: `Your password has been successfully changed, ${firstName}.`,
    };

    return await this.sendEmail(emailOptions);
  }

  /**
   * Get email verification template
   * @param {string} verificationUrl - Verification URL
   * @returns {string} - HTML template
   */
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Thank you for registering with SirtifAI!</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with SirtifAI, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   * @param {string} resetUrl - Reset URL
   * @returns {string} - HTML template
   */
  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password for your SirtifAI account.</p>
            <p>Please click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 10 minutes.</p>
            <p><strong>If you didn't request this password reset, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>For security reasons, this link will only work once.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email template
   * @param {string} firstName - User's first name
   * @returns {string} - HTML template
   */
  getWelcomeEmailTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SirtifAI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SirtifAI!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Welcome to SirtifAI! We're excited to have you on board.</p>
            <p>Your account has been successfully created and verified. You can now start using all the features of our platform.</p>
            <p>If you have any questions or need help getting started, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The SirtifAI Team</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing SirtifAI!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get account suspension email template
   * @param {string} firstName - User's first name
   * @param {string} reason - Suspension reason
   * @returns {string} - HTML template
   */
  getAccountSuspensionEmailTemplate(firstName, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspended</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Suspended</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We're writing to inform you that your SirtifAI account has been suspended.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
            <p>Best regards,<br>The SirtifAI Team</p>
          </div>
          <div class="footer">
            <p>For support, please contact us at support@sirtifai.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password change notification template
   * @param {string} firstName - User's first name
   * @returns {string} - HTML template
   */
  getPasswordChangeNotificationTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>This is to confirm that your SirtifAI account password has been successfully changed.</p>
            <p>If you made this change, no further action is required.</p>
            <p>If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
            <p>Best regards,<br>The SirtifAI Team</p>
          </div>
          <div class="footer">
            <p>For security concerns, please contact us at security@sirtifai.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();

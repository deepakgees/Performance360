/**
 * Email Service Utility
 *
 * Provides functionality for sending emails using nodemailer.
 * Currently supports password reset emails.
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

/**
 * Format custom message for email HTML
 * Converts plain text line breaks to HTML paragraphs and ensures proper styling
 */
const formatMessageForEmail = (message: string): string => {
  // Check if message already contains HTML tags
  const hasHtmlTags = /<[^>]+>/.test(message);
  
  if (hasHtmlTags) {
    // Message contains HTML - ensure paragraphs have proper styling
    // First, handle <p> tags with attributes
    let formatted = message.replace(/<p\s+([^>]*)>/gi, (match, attrs) => {
      // If style attribute already exists, keep it, otherwise add our style
      if (attrs.includes('style=')) {
        return match;
      }
      return `<p ${attrs} style="margin: 0 0 15px 0; color: #333;">`;
    });
    
    // Then handle <p> tags without attributes
    formatted = formatted.replace(/<p\s*>/gi, '<p style="margin: 0 0 15px 0; color: #333;">');
    
    // Ensure <br> tags are properly formatted
    formatted = formatted.replace(/<br\s*\/?>/gi, '<br style="line-height: 1.6;">');
    
    return formatted;
  } else {
    // Plain text message - convert line breaks to paragraphs
    // Split by double line breaks (paragraph breaks) or single line breaks
    const paragraphs = message
      .split(/\n\s*\n/) // Split by double line breaks first
      .map(para => para.trim())
      .filter(para => para.length > 0);
    
    if (paragraphs.length === 0) {
      // No paragraphs found, treat entire message as one paragraph
      return `<p style="margin: 0 0 15px 0; color: #333; white-space: pre-wrap;">${message.trim()}</p>`;
    }
    
    // Convert each paragraph to a <p> tag with proper styling
    return paragraphs
      .map(para => {
        // Replace single line breaks within paragraph with <br>
        const withBreaks = para.replace(/\n/g, '<br style="line-height: 1.6;">');
        return `<p style="margin: 0 0 15px 0; color: #333;">${withBreaks}</p>`;
      })
      .join('');
  }
};

/**
 * Email transporter configuration
 * Uses SMTP settings from environment variables
 */
const createTransporter = () => {
  // Check if email is configured
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    logger.logWarning(
      'Email service not configured. SMTP settings missing in environment variables.',
      undefined,
      'EMAIL',
      'emailService'
    );
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT, 10);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: !isSecure && port === 587, // Require TLS for port 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // TLS options for secure connections
    tls: {
      // Do not fail on invalid certificates (useful for self-signed certs)
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      // Minimum TLS version
      minVersion: 'TLSv1.2',
    },
    // Debug mode (set to true to see SMTP communication)
    debug: process.env.SMTP_DEBUG === 'true',
    logger: process.env.SMTP_DEBUG === 'true',
  });
};

/**
 * Send password reset email to user
 *
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} resetToken - Password reset token
 * @param {string} frontendUrl - Frontend URL for the reset link
 * @returns {Promise<boolean>} True if email was sent successfully, false otherwise
 */
export const sendPasswordResetEmail = async (
  email: string,
  firstName: string,
  resetToken: string,
  frontendUrl?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.logError(
        'Cannot send email: Email service not configured',
        new Error('SMTP settings missing')
      );
      return false;
    }

    // Determine frontend URL
    const baseUrl =
      frontendUrl ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const loginLink = `${baseUrl}/login`;

    // Get sender information from environment variables
    // SMTP_FROM_NAME: Display name (default: "Performance360")
    // SMTP_FROM_EMAIL: Sender email address (defaults to SMTP_USER if not set)
    // SMTP_HIDE_SENDER_EMAIL: If set to "true", attempts to hide the sender email address
    //   Note: Many email providers (especially Gmail) will still show the authenticated email
    //   for security reasons. This is a limitation of email providers, not the application.
    const fromName = process.env.SMTP_FROM_NAME || 'Performance360';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const replyTo = process.env.SMTP_REPLY_TO || 'noreply@performance360.com';
    const hideSenderEmail = process.env.SMTP_HIDE_SENDER_EMAIL === 'true';
    
    // Format the "from" field
    // If hiding sender email is requested, try using just the display name
    // Note: This may not work with all email providers (Gmail will override it)
    const fromField = hideSenderEmail && fromEmail
      ? `"${fromName}"` // Try without email (may not work with all providers)
      : `"${fromName}" <${fromEmail}>`; // Standard format with email

    const mailOptions = {
      from: fromField,
      replyTo: replyTo,
      // Some email providers use "sender" field as well
      ...(hideSenderEmail && { sender: fromName }),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password for your Performance360 account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>Important:</strong> This link will expire in 1 day. If you didn't request a password reset, please ignore this email.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Or if you remember your password, you can login directly:
              </p>
              <a href="${loginLink}" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Login to Application
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName},
        
        We received a request to reset your password for your Performance360 account.
        
        Click the following link to reset your password:
        ${resetLink}
        
        This link will expire in 1 day. If you didn't request a password reset, please ignore this email.
        
        Or if you remember your password, you can login directly:
        ${loginLink}
        
        This is an automated message. Please do not reply to this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.logInfo(
      `Password reset email sent successfully to ${email}`,
      undefined,
      'EMAIL',
      'emailService'
    );
    return true;
  } catch (error: any) {
    // Provide more helpful error messages for common issues
    if (error.code === 'EAUTH') {
      logger.logError(
        'Email authentication failed. Please check your SMTP credentials. For Gmail, you need to use an App Password instead of your regular password.',
        error
      );
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const smtpHost = process.env.SMTP_HOST || 'unknown';
      const smtpPort = process.env.SMTP_PORT || 'unknown';
      logger.logError(
        `Cannot connect to SMTP server ${smtpHost}:${smtpPort}. ` +
        `This is usually caused by: ` +
        `1) Firewall blocking outbound SMTP connections (port ${smtpPort}), ` +
        `2) Network restrictions preventing access to external SMTP servers, ` +
        `3) SMTP server is down or unreachable. ` +
        `Please check your network configuration and firewall settings.`,
        error
      );
    } else {
      logger.logError('Error sending password reset email', error);
    }
    return false;
  }
};

/**
 * Send customized email to user with password reset link
 *
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} resetToken - Password reset token
 * @param {string} subject - Email subject
 * @param {string} customMessage - Custom message content (HTML supported)
 * @param {string} frontendUrl - Frontend URL for the reset link
 * @returns {Promise<boolean>} True if email was sent successfully, false otherwise
 */
export const sendCustomizedEmailWithResetLink = async (
  email: string,
  firstName: string,
  resetToken: string,
  subject: string,
  customMessage: string,
  frontendUrl?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.logError(
        'Cannot send email: Email service not configured',
        new Error('SMTP settings missing')
      );
      return false;
    }

    // Determine frontend URL
    const baseUrl =
      frontendUrl ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    const loginLink = `${baseUrl}/login`;

    // Get sender information from environment variables
    // SMTP_FROM_NAME: Display name (default: "Performance360")
    // SMTP_FROM_EMAIL: Sender email address (defaults to SMTP_USER if not set)
    // SMTP_HIDE_SENDER_EMAIL: If set to "true", attempts to hide the sender email address
    //   Note: Many email providers (especially Gmail) will still show the authenticated email
    //   for security reasons. This is a limitation of email providers, not the application.
    const fromName = process.env.SMTP_FROM_NAME || 'Performance360';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const replyTo = process.env.SMTP_REPLY_TO || 'noreply@performance360.com';
    const hideSenderEmail = process.env.SMTP_HIDE_SENDER_EMAIL === 'true';
    
    // Format the "from" field
    // If hiding sender email is requested, try using just the display name
    // Note: This may not work with all email providers (Gmail will override it)
    const fromField = hideSenderEmail && fromEmail
      ? `"${fromName}"` // Try without email (may not work with all providers)
      : `"${fromName}" <${fromEmail}>`; // Standard format with email

    // Format custom message for HTML email with proper paragraph styling
    const formattedMessage = formatMessageForEmail(customMessage);
    
    // Escape HTML in custom message for text version, but allow HTML in HTML version
    const textMessage = customMessage
      .replace(/<[^>]*>/g, '') // Remove HTML tags for text version
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const mailOptions = {
      from: fromField,
      replyTo: replyTo,
      // Some email providers use "sender" field as well
      ...(hideSenderEmail && { sender: fromName }),
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">${subject}</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 15px 0; color: #333;">Hello ${firstName},</p>
            <div style="margin: 0 0 20px 0;">
              ${formattedMessage}
            </div>
            <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #4f46e5; border-radius: 4px;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #1e40af;">Password Reset Link</p>
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #1e3a8a;">
                If you need to reset your password, click the button below:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0 0;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #4f46e5; word-break: break-all; font-size: 11px;">${resetLink}</a>
              </p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
                <strong>Note:</strong> This link will expire in 1 day.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Or if you remember your password, you can login directly:
              </p>
              <a href="${loginLink}" 
                 style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Login to Application
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${firstName},
        
        ${textMessage}
        
        Password Reset Link:
        If you need to reset your password, use the following link:
        ${resetLink}
        
        Note: This link will expire in 1 day.
        
        Or if you remember your password, you can login directly:
        ${loginLink}
        
        This is an automated message. Please do not reply to this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.logInfo(
      `Customized email with reset link sent successfully to ${email}`,
      undefined,
      'EMAIL',
      'emailService'
    );
    return true;
  } catch (error: any) {
    // Provide more helpful error messages for common issues
    if (error.code === 'EAUTH') {
      logger.logError(
        'Email authentication failed. Please check your SMTP credentials. For Gmail, you need to use an App Password instead of your regular password.',
        error
      );
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const smtpHost = process.env.SMTP_HOST || 'unknown';
      const smtpPort = process.env.SMTP_PORT || 'unknown';
      logger.logError(
        `Cannot connect to SMTP server ${smtpHost}:${smtpPort}. ` +
        `This is usually caused by: ` +
        `1) Firewall blocking outbound SMTP connections (port ${smtpPort}), ` +
        `2) Network restrictions preventing access to external SMTP servers, ` +
        `3) SMTP server is down or unreachable. ` +
        `Please check your network configuration and firewall settings.`,
        error
      );
    } else {
      logger.logError('Error sending customized email with reset link', error);
    }
    return false;
  }
};


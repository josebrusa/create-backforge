import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateServices(servicesDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const authServiceContent = `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from './email.service.js';
import { eventEmitter, Events } from '../events/eventEmitter.js';
${config.includeQueue ? "import { queueService } from '../queue/service.js';" : ''}
import { AppError } from '../middlewares/errorHandler.js';

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

export const authService = {
  async register(email: string, password: string, name?: string) {
    const existingUser = await userRepository.findByEmail(email);
    
    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Emit user registered event
    eventEmitter.emit(Events.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Send verification email
    try {
      ${config.includeQueue ? `// Use queue for async email sending
      const verificationUrl = \`\${config.APP_URL}/api/auth/verify-email?token=\${verificationToken}\`;
      const html = \`<h1>Verify your email</h1><p>Click <a href="\${verificationUrl}">here</a> to verify your email.</p>\`;
      await queueService.addEmailJob({
        to: email,
        subject: 'Verify your email',
        html,
      });` : `await emailService.sendVerificationEmail(email, verificationToken, name);`}
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      message: 'Registration successful. Please check your email to verify your account.',
    };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new AppError(403, 'Please verify your email before logging in');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      token,
    };
  },

  async verifyEmail(token: string) {
    const user = await userRepository.findByVerificationToken(token);
    
    if (!user) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    await userRepository.updateEmailVerification(user.id, true);

    // Emit user verified event
    eventEmitter.emit(Events.USER_VERIFIED, {
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'Email verified successfully',
    };
  },

  async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      throw new AppError(400, 'Email is already verified');
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await userRepository.updateVerificationToken(user.id, verificationToken, verificationExpires);

    try {
      ${config.includeQueue ? `const verificationUrl = \`\${config.APP_URL}/api/auth/verify-email?token=\${verificationToken}\`;
      const html = \`<h1>Verify your email</h1><p>Click <a href="\${verificationUrl}">here</a> to verify your email.</p>\`;
      await queueService.addEmailJob({
        to: email,
        subject: 'Verify your email',
        html,
      });` : `await emailService.sendVerificationEmail(email, verificationToken, user.name || undefined);`}
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new AppError(500, 'Failed to send verification email');
    }

    return {
      message: 'Verification email sent',
    };
  },

  async requestPasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const resetToken = generateResetToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await userRepository.updatePasswordResetToken(user.id, resetToken, resetExpires);

    // Emit password reset requested event
    eventEmitter.emit(Events.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      email: user.email,
    });

    try {
      ${config.includeQueue ? `// Use queue for async email sending
      const resetUrl = \`\${config.APP_URL}/api/auth/reset-password?token=\${resetToken}\`;
      const html = \`<h1>Reset your password</h1><p>Click <a href="\${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>\`;
      await queueService.addEmailJob({
        to: email,
        subject: 'Reset your password',
        html,
      });` : `await emailService.sendPasswordResetEmail(email, resetToken, user.name || undefined);`}
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new AppError(500, 'Failed to send password reset email');
    }

    return {
      message: 'Password reset email sent',
    };
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await userRepository.findByPasswordResetToken(token);
    
    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.id, hashedPassword);

    // Emit password reset event
    eventEmitter.emit(Events.PASSWORD_RESET, {
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'Password reset successfully',
    };
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
`;

    await fs.writeFile(
      path.join(servicesDir, 'auth.service.ts'),
      authServiceContent
    );

    // email.service.ts
    const emailServiceContent = `import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const createTransporter = () => {
  // If email is not configured, use a test account (for development)
  if (!config.EMAIL_HOST) {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test',
      },
    });
  }

  return nodemailer.createTransporter({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_SECURE,
    auth: config.EMAIL_USER && config.EMAIL_PASSWORD ? {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD,
    } : undefined,
  });
};

const transporter = createTransporter();

export const emailService = {
  async sendVerificationEmail(email: string, token: string, name?: string) {
    const verificationUrl = \`\${config.APP_URL}/api/auth/verify-email?token=\${token}\`;
    
    const mailOptions = {
      from: config.EMAIL_FROM,
      to: email,
      subject: 'Verify your email address',
      html: \`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to CoreBack!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello \${name || 'there'}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="\${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all;">\${verificationUrl}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
          </div>
        </body>
        </html>
      \`,
    };

    await transporter.sendMail(mailOptions);
  },

  async sendPasswordResetEmail(email: string, token: string, name?: string) {
    const resetUrl = \`\${config.APP_URL}/api/auth/reset-password?token=\${token}\`;
    
    const mailOptions = {
      from: config.EMAIL_FROM,
      to: email,
      subject: 'Reset your password',
      html: \`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello \${name || 'there'}!</h2>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="\${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all;">\${resetUrl}</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      \`,
    };

    await transporter.sendMail(mailOptions);
  },
};
`;

    await fs.writeFile(
      path.join(servicesDir, 'email.service.ts'),
      emailServiceContent
    );
  }
}

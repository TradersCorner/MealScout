import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import type { User, Restaurant } from '@shared/schema';

// Initialize Brevo with API key validation
const transactionalEmailsApi = new TransactionalEmailsApi();

// Check if Brevo is properly configured
export const isEmailConfigured = (): boolean => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('BREVO_API_KEY environment variable is not set. Email functionality will be disabled.');
    return false;
  }
  
  try {
    transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
    return true;
  } catch (error) {
    console.error('Failed to configure Brevo:', error);
    return false;
  }
};

// Email configuration
const EMAIL_CONFIG = {
  fromEmail: 'info.mealscout@gmail.com',
  fromName: 'MealScout',
  adminEmail: 'info.mealscout@gmail.com', // Admin notifications will be sent here
};

// Base email interface
interface BaseEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email templates
class EmailTemplates {
  private static getBaseTemplate(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .tagline {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .content h2 {
            color: #ff6b35;
            font-size: 24px;
            margin: 0 0 20px 0;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .highlight-box {
            background-color: #fff8f5;
            border-left: 4px solid #ff6b35;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .features {
            margin: 30px 0;
        }
        .feature {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 12px 0;
        }
        .feature-icon {
            background-color: #ff6b35;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        .feature-text {
            flex: 1;
        }
        .feature-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        .feature-desc {
            color: #666;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .footer .social-links {
            margin: 20px 0 10px 0;
        }
        .footer .social-links a {
            color: #ff6b35;
            text-decoration: none;
            margin: 0 8px;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content h2 {
                font-size: 20px;
            }
            .feature {
                flex-direction: column;
                align-items: flex-start;
            }
            .feature-icon {
                margin-bottom: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ MealScout</h1>
            <div class="tagline">Discover Amazing Food Deals</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <div class="social-links">
                <a href="#" target="_blank">Facebook</a>
                <a href="#" target="_blank">Instagram</a>
                <a href="#" target="_blank">Twitter</a>
            </div>
            <p>© 2025 MealScout. All rights reserved.</p>
            <p>This email was sent to you because you signed up for MealScout.</p>
        </div>
    </div>
</body>
</html>`;
  }

  static getCustomerWelcomeTemplate(user: User): { html: string; text: string } {
    const content = `
      <h2>Welcome to Your Food Adventure! 🎉</h2>
      <p>Hey ${user.firstName || 'Food Explorer'}!</p>
      <p>Welcome to MealScout – your personal guide to discovering incredible food deals around you! We're thrilled to have you join our community of savvy food lovers.</p>
      
      <div class="highlight-box">
        <strong>🎯 What makes MealScout special?</strong><br>
        We connect you with exclusive deals from local restaurants, food trucks, and cafes that you won't find anywhere else!
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">🔥</div>
          <div class="feature-text">
            <div class="feature-title">Exclusive Deals</div>
            <div class="feature-desc">Access restaurant deals up to 50% off your favorite meals</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">📍</div>
          <div class="feature-text">
            <div class="feature-title">Location-Based Discovery</div>
            <div class="feature-desc">Find amazing food deals right in your neighborhood</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🚚</div>
          <div class="feature-text">
            <div class="feature-title">Food Truck Tracker</div>
            <div class="feature-desc">Never miss your favorite food truck with real-time location updates</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">⭐</div>
          <div class="feature-text">
            <div class="feature-title">Personalized Recommendations</div>
            <div class="feature-desc">Discover new restaurants based on your preferences and reviews</div>
          </div>
        </div>
      </div>

      <p><strong>Ready to start saving?</strong> Open the MealScout app and start exploring delicious deals in your area. Your taste buds (and wallet) will thank you!</p>
      
      <p>Happy eating!<br>
      The MealScout Team 🍽️</p>
    `;

    const html = this.getBaseTemplate('Welcome to MealScout!', content);
    const text = `Welcome to MealScout, ${user.firstName || 'Food Explorer'}!

We're thrilled to have you join our community of savvy food lovers. MealScout connects you with exclusive deals from local restaurants, food trucks, and cafes.

What you can expect:
• Exclusive deals up to 50% off your favorite meals
• Location-based discovery of nearby food deals
• Real-time food truck tracking
• Personalized restaurant recommendations

Ready to start saving? Open the MealScout app and start exploring delicious deals in your area.

Happy eating!
The MealScout Team

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getRestaurantOwnerWelcomeTemplate(user: User): { html: string; text: string } {
    const content = `
      <h2>Welcome to MealScout Business! 🚀</h2>
      <p>Hello ${user.firstName || 'Business Owner'}!</p>
      <p>Congratulations on joining MealScout! You're now part of a powerful platform that connects local restaurants with hungry customers looking for amazing deals.</p>
      
      <div class="highlight-box">
        <strong>🎯 Grow Your Business with MealScout</strong><br>
        Our platform helps you attract new customers, fill empty tables during slow hours, and boost your revenue with strategic deal campaigns.
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">📈</div>
          <div class="feature-text">
            <div class="feature-title">Increase Revenue</div>
            <div class="feature-desc">Create targeted deals to drive sales during slow periods and attract new customers</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🎯</div>
          <div class="feature-text">
            <div class="feature-title">Smart Deal Management</div>
            <div class="feature-desc">Set time limits, usage limits, and track performance with detailed analytics</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">👥</div>
          <div class="feature-text">
            <div class="feature-title">Customer Discovery</div>
            <div class="feature-desc">Reach food lovers in your area who are actively looking for great deals</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <div class="feature-title">Performance Analytics</div>
            <div class="feature-desc">Track deal performance, customer engagement, and ROI with detailed insights</div>
          </div>
        </div>
      </div>

      <p><strong>Next Steps:</strong></p>
      <p>1. Complete your restaurant profile with photos and details<br>
      2. Create your first deal to attract customers<br>
      3. Monitor performance and optimize your campaigns</p>
      
      <p>Our support team is here to help you succeed. If you have any questions, don't hesitate to reach out!</p>
      
      <p>Here's to your business growth!<br>
      The MealScout Business Team 💼</p>
    `;

    const html = this.getBaseTemplate('Welcome to MealScout Business!', content);
    const text = `Welcome to MealScout Business, ${user.firstName || 'Business Owner'}!

Congratulations on joining MealScout! You're now part of a powerful platform that connects local restaurants with hungry customers.

What MealScout Business offers:
• Increase revenue with strategic deal campaigns
• Smart deal management with limits and analytics
• Reach customers actively looking for deals
• Performance analytics and insights

Next Steps:
1. Complete your restaurant profile with photos and details
2. Create your first deal to attract customers
3. Monitor performance and optimize your campaigns

Our support team is here to help you succeed!

Here's to your business growth!
The MealScout Business Team

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getAdminWelcomeTemplate(user: User): { html: string; text: string } {
    const content = `
      <h2>Admin Access Granted 🔐</h2>
      <p>Hello ${user.firstName || 'Admin'}!</p>
      <p>Your MealScout admin account has been created successfully. You now have access to the administrative dashboard and all management features.</p>
      
      <div class="highlight-box">
        <strong>🛠️ Admin Capabilities</strong><br>
        Monitor platform activity, manage users and restaurants, review verification requests, and oversee system operations.
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">👥</div>
          <div class="feature-text">
            <div class="feature-title">User Management</div>
            <div class="feature-desc">Manage customer and restaurant owner accounts</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🏪</div>
          <div class="feature-text">
            <div class="feature-title">Restaurant Oversight</div>
            <div class="feature-desc">Review verification requests and manage restaurant listings</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-text">
            <div class="feature-title">Platform Analytics</div>
            <div class="feature-desc">Monitor platform performance, user engagement, and system health</div>
          </div>
        </div>
      </div>

      <p>Access your admin dashboard to get started with platform management.</p>
      
      <p>Best regards,<br>
      The MealScout Development Team ⚙️</p>
    `;

    const html = this.getBaseTemplate('MealScout Admin Access', content);
    const text = `MealScout Admin Access Granted

Hello ${user.firstName || 'Admin'}!

Your MealScout admin account has been created successfully. You now have access to the administrative dashboard and all management features.

Admin Capabilities:
• User management for customers and restaurant owners
• Restaurant oversight and verification requests
• Platform analytics and system monitoring

Access your admin dashboard to get started.

Best regards,
The MealScout Development Team

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getPaymentConfirmationTemplate(user: User, amount: number, interval: string, subscriptionId: string): { html: string; text: string } {
    const content = `
      <h2>Payment Confirmation 💳</h2>
      <p>Hello ${user.firstName || 'Valued Customer'}!</p>
      <p>Thank you for your payment! Your MealScout subscription has been successfully processed.</p>
      
      <div class="highlight-box">
        <strong>Payment Details</strong><br>
        Amount: $${(amount / 100).toFixed(2)}<br>
        Billing Cycle: ${interval === 'month' ? 'Monthly' : interval === '3-month' ? 'Quarterly' : 'Yearly'}<br>
        Subscription ID: ${subscriptionId}
      </div>

      <p>Your premium features are now active and you can enjoy:</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🎯</div>
          <div class="feature-text">
            <div class="feature-title">Priority Access</div>
            <div class="feature-desc">Get early access to the best deals before they sell out</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🔔</div>
          <div class="feature-text">
            <div class="feature-title">Smart Notifications</div>
            <div class="feature-desc">Receive personalized deal alerts based on your preferences</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">⭐</div>
          <div class="feature-text">
            <div class="feature-title">Premium Support</div>
            <div class="feature-desc">Priority customer support and exclusive member benefits</div>
          </div>
        </div>
      </div>

      <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for being a valued MealScout member!<br>
      The MealScout Team 💖</p>
    `;

    const html = this.getBaseTemplate('Payment Confirmation - MealScout', content);
    const text = `MealScout Payment Confirmation

Hello ${user.firstName || 'Valued Customer'}!

Thank you for your payment! Your MealScout subscription has been successfully processed.

Payment Details:
Amount: $${(amount / 100).toFixed(2)}
Billing Cycle: ${interval === 'month' ? 'Monthly' : interval === '3-month' ? 'Quarterly' : 'Yearly'}
Subscription ID: ${subscriptionId}

Your premium features are now active:
• Priority access to the best deals
• Smart personalized notifications
• Premium customer support

Thank you for being a valued MealScout member!
The MealScout Team

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getAdminNotificationTemplate(user: User, restaurant?: Restaurant): { html: string; text: string } {
    const userTypeDisplay = user.userType === 'customer' ? 'Customer' : user.userType === 'restaurant_owner' ? 'Restaurant Owner' : 'Admin';
    
    let locationInfo = '';
    if (restaurant) {
      locationInfo = `
        <strong>Restaurant Details:</strong><br>
        Name: ${restaurant.name}<br>
        Address: ${restaurant.address}<br>
        Phone: ${restaurant.phone || 'Not provided'}<br>
        Business Type: ${restaurant.businessType}<br>
        Cuisine: ${restaurant.cuisineType || 'Not specified'}<br>
        ${restaurant.isFoodTruck ? 'Food Truck: Yes' : ''}
      `;
    }

    const content = `
      <h2>New User Registration Alert 🔔</h2>
      <p>A new user has joined MealScout!</p>
      
      <div class="highlight-box">
        <strong>User Information:</strong><br>
        Name: ${user.firstName || ''} ${user.lastName || ''}<br>
        Email: ${user.email}<br>
        User Type: ${userTypeDisplay}<br>
        Registration Date: ${new Date().toLocaleDateString()}<br>
        ${locationInfo}
      </div>

      <p>This notification was generated automatically by the MealScout system.</p>
    `;

    const html = this.getBaseTemplate('New User Registration - MealScout Admin', content);
    const text = `New User Registration Alert

A new user has joined MealScout!

User Information:
Name: ${user.firstName || ''} ${user.lastName || ''}
Email: ${user.email}
User Type: ${userTypeDisplay}
Registration Date: ${new Date().toLocaleDateString()}

${restaurant ? `Restaurant Details:
Name: ${restaurant.name}
Address: ${restaurant.address}
Phone: ${restaurant.phone || 'Not provided'}
Business Type: ${restaurant.businessType}
Cuisine: ${restaurant.cuisineType || 'Not specified'}
${restaurant.isFoodTruck ? 'Food Truck: Yes' : ''}` : ''}

This notification was generated automatically by the MealScout system.

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getAdminSignupNotificationTemplate(user: User, context?: { signupMethod?: string; restaurant?: Restaurant }): { html: string; text: string } {
    const userTypeDisplay = user.userType === 'customer' ? 'Customer' : user.userType === 'restaurant_owner' ? 'Restaurant Owner' : 'Admin';
    const signupMethod = context?.signupMethod || 'Email';
    
    let restaurantInfo = '';
    if (context?.restaurant) {
      restaurantInfo = `
        <div class="feature">
          <div class="feature-icon">🏪</div>
          <div class="feature-text">
            <div class="feature-title">Restaurant Information</div>
            <div class="feature-desc">
              <strong>Name:</strong> ${context.restaurant.name}<br>
              <strong>Address:</strong> ${context.restaurant.address}<br>
              <strong>Phone:</strong> ${context.restaurant.phone || 'Not provided'}<br>
              <strong>Business Type:</strong> ${context.restaurant.businessType}<br>
              <strong>Cuisine Type:</strong> ${context.restaurant.cuisineType || 'Not specified'}<br>
              ${context.restaurant.isFoodTruck ? '<strong>Food Truck:</strong> Yes<br>' : ''}
              <strong>Verified:</strong> ${context.restaurant.isVerified ? 'Yes' : 'Pending'}
            </div>
          </div>
        </div>
      `;
    }

    const content = `
      <h2>New MealScout Signup 🎉</h2>
      <p>A new user has registered for MealScout and requires admin attention.</p>
      
      <div class="highlight-box">
        <strong>📋 User Summary</strong><br>
        <strong>Name:</strong> ${user.firstName || ''} ${user.lastName || ''}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>User Type:</strong> ${userTypeDisplay}<br>
        <strong>Signup Method:</strong> ${signupMethod}<br>
        <strong>Registration Date:</strong> ${new Date().toLocaleDateString()}
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">👤</div>
          <div class="feature-text">
            <div class="feature-title">Account Details</div>
            <div class="feature-desc">
              <strong>User ID:</strong> ${user.id || 'Pending'}<br>
              <strong>Account Status:</strong> Active<br>
              <strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'Pending'}
            </div>
          </div>
        </div>
        ${restaurantInfo}
      </div>

      ${user.userType === 'restaurant_owner' ? `
        <div class="highlight-box" style="border-left-color: #f7931e;">
          <strong>⚠️ Action Required</strong><br>
          This restaurant owner account may require verification review before full platform access is granted.
        </div>
      ` : ''}

      <p>You can manage this user account through the MealScout admin dashboard.</p>
      
      <p>For questions or support, contact our development team.<br>
      <strong>MealScout Admin System</strong> 🛠️</p>
    `;

    const html = this.getBaseTemplate('New MealScout Signup', content);
    const text = `New MealScout Signup

A new user has registered for MealScout:

User Information:
Name: ${user.firstName || ''} ${user.lastName || ''}
Email: ${user.email}
User Type: ${userTypeDisplay}
Signup Method: ${signupMethod}
Registration Date: ${new Date().toLocaleDateString()}
User ID: ${user.id || 'Pending'}
Account Status: Active
Email Verified: ${user.emailVerified ? 'Yes' : 'Pending'}

${context?.restaurant ? `Restaurant Details:
Name: ${context.restaurant.name}
Address: ${context.restaurant.address}
Phone: ${context.restaurant.phone || 'Not provided'}
Business Type: ${context.restaurant.businessType}
Cuisine Type: ${context.restaurant.cuisineType || 'Not specified'}
${context.restaurant.isFoodTruck ? 'Food Truck: Yes' : ''}
Verified: ${context.restaurant.isVerified ? 'Yes' : 'Pending'}` : ''}

${user.userType === 'restaurant_owner' ? 'ACTION REQUIRED: This restaurant owner account may require verification review.' : ''}

You can manage this user account through the MealScout admin dashboard.

MealScout Admin System

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }

  static getPasswordResetTemplate(user: User, resetUrl: string): { html: string; text: string } {
    const content = `
      <h2>Reset Your MealScout Password 🔐</h2>
      <p>Hello ${user.firstName || 'MealScout User'}!</p>
      <p>We received a request to reset the password for your MealScout account. If you made this request, click the button below to create a new password.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="cta-button" style="display: inline-block;">Reset My Password</a>
      </div>

      <div class="highlight-box">
        <strong>🛡️ Security Information</strong><br>
        • This password reset link is valid for <strong>1 hour</strong><br>
        • The link can only be used once<br>
        • If you didn't request this reset, you can safely ignore this email<br>
        • Your current password will remain unchanged until you create a new one
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">⚠️</div>
          <div class="feature-text">
            <div class="feature-title">Didn't Request This?</div>
            <div class="feature-desc">If you didn't request a password reset, please ignore this email. Your account remains secure.</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🔒</div>
          <div class="feature-text">
            <div class="feature-title">Keep Your Account Secure</div>
            <div class="feature-desc">Choose a strong password with at least 8 characters, including numbers and special characters.</div>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">❓</div>
          <div class="feature-text">
            <div class="feature-title">Need Help?</div>
            <div class="feature-desc">If you're having trouble accessing your account, contact our support team at info.mealscout@gmail.com</div>
          </div>
        </div>
      </div>

      <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
      <span style="word-break: break-all; color: #ff6b35; font-size: 14px;">${resetUrl}</span></p>
      
      <p>Best regards,<br>
      The MealScout Security Team 🔐</p>
    `;

    const html = this.getBaseTemplate('Reset Your MealScout Password', content);
    const text = `Reset Your MealScout Password

Hello ${user.firstName || 'MealScout User'}!

We received a request to reset the password for your MealScout account. If you made this request, use the link below to create a new password.

Reset Link: ${resetUrl}

Security Information:
• This password reset link is valid for 1 hour
• The link can only be used once
• If you didn't request this reset, you can safely ignore this email
• Your current password will remain unchanged until you create a new one

Didn't Request This?
If you didn't request a password reset, please ignore this email. Your account remains secure.

Keep Your Account Secure:
Choose a strong password with at least 8 characters, including numbers and special characters.

Need Help?
If you're having trouble accessing your account, contact our support team at info.mealscout@gmail.com

Best regards,
The MealScout Security Team

© 2025 MealScout. All rights reserved.`;

    return { html, text };
  }
}

// Email service class
export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean;

  private constructor() {
    this.isConfigured = isEmailConfigured();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async sendEmail(params: BaseEmailParams): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn(`Email not sent to ${params.to}: Brevo not configured`);
      return false;
    }

    try {
      await transactionalEmailsApi.sendTransacEmail({
        to: [{ 
          email: params.to 
        }],
        sender: {
          email: EMAIL_CONFIG.fromEmail,
          name: EMAIL_CONFIG.fromName,
        },
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
      });
      
      console.log(`Email sent successfully to ${params.to}: ${params.subject}`);
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${params.to}:`, error);
      return false;
    }
  }

  // Send welcome email based on user type
  async sendWelcomeEmail(user: User): Promise<boolean> {
    let template: { html: string; text: string };
    let subject: string;

    switch (user.userType) {
      case 'customer':
        template = EmailTemplates.getCustomerWelcomeTemplate(user);
        subject = 'Welcome to MealScout - Start Discovering Amazing Food Deals! 🍽️';
        break;
      case 'restaurant_owner':
        template = EmailTemplates.getRestaurantOwnerWelcomeTemplate(user);
        subject = 'Welcome to MealScout Business - Grow Your Restaurant! 🚀';
        break;
      case 'admin':
        template = EmailTemplates.getAdminWelcomeTemplate(user);
        subject = 'MealScout Admin Access Granted 🔐';
        break;
      default:
        console.warn(`Unknown user type: ${user.userType}`);
        return false;
    }

    return await this.sendEmail({
      to: user.email!,
      subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(user: User, amount: number, interval: string, subscriptionId: string): Promise<boolean> {
    const template = EmailTemplates.getPaymentConfirmationTemplate(user, amount, interval, subscriptionId);
    
    return await this.sendEmail({
      to: user.email!,
      subject: 'Payment Confirmation - MealScout Subscription 💳',
      html: template.html,
      text: template.text,
    });
  }

  // Send admin notification when new user signs up
  async sendAdminNotification(user: User, restaurant?: Restaurant): Promise<boolean> {
    const template = EmailTemplates.getAdminNotificationTemplate(user, restaurant);
    
    return await this.sendEmail({
      to: EMAIL_CONFIG.adminEmail,
      subject: `New ${user.userType === 'customer' ? 'Customer' : user.userType === 'restaurant_owner' ? 'Restaurant Owner' : 'Admin'} Registration - ${user.firstName || ''} ${user.lastName || ''}`,
      html: template.html,
      text: template.text,
    });
  }

  // Send admin signup notification with enhanced details
  async sendAdminSignupNotification(user: User, context?: { signupMethod?: string; restaurant?: Restaurant }): Promise<boolean> {
    const template = EmailTemplates.getAdminSignupNotificationTemplate(user, context);
    
    return await this.sendEmail({
      to: EMAIL_CONFIG.adminEmail,
      subject: `New MealScout Signup - ${user.firstName || ''} ${user.lastName || ''} (${user.userType})`,
      html: template.html,
      text: template.text,
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(user: User, resetUrl: string): Promise<boolean> {
    const template = EmailTemplates.getPasswordResetTemplate(user, resetUrl);
    
    return await this.sendEmail({
      to: user.email!,
      subject: 'Reset your MealScout password 🔐',
      html: template.html,
      text: template.text,
    });
  }

  // Utility method to check if email service is available
  isAvailable(): boolean {
    return this.isConfigured;
  }
}

// Convenience functions for rendering email content
export function renderAdminSignupEmail(user: User, context?: { signupMethod?: string; restaurant?: Restaurant }): { html: string; text: string } {
  return EmailTemplates.getAdminSignupNotificationTemplate(user, context);
}

export function renderPasswordResetEmail(user: User, resetUrl: string): { html: string; text: string } {
  return EmailTemplates.getPasswordResetTemplate(user, resetUrl);
}

// Export singleton instance
export const emailService = EmailService.getInstance();
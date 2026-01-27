var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, } from "@getbrevo/brevo";
// Initialize Brevo with API key validation
var transactionalEmailsApi = new TransactionalEmailsApi();
// Check if Brevo is properly configured
export var isEmailConfigured = function () {
    var apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.warn("BREVO_API_KEY environment variable is not set. Email functionality will be disabled.");
        return false;
    }
    try {
        transactionalEmailsApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
        return true;
    }
    catch (error) {
        console.error("Failed to configure Brevo:", error);
        return false;
    }
};
// Email configuration
var EMAIL_CONFIG = {
    fromEmail: process.env.EMAIL_FROM ||
        process.env.ADMIN_EMAIL ||
        "info.mealscout@gmail.com",
    fromName: process.env.EMAIL_FROM_NAME || "MealScout",
    adminEmail: process.env.ADMIN_EMAIL ||
        process.env.EMAIL_FROM ||
        "info.mealscout@gmail.com", // Admin notifications will be sent here
};
// Email templates
var EmailTemplates = /** @class */ (function () {
    function EmailTemplates() {
    }
    EmailTemplates.getBaseTemplate = function (title, content) {
        return "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>".concat(title, "</title>\n    <style>\n        body {\n            margin: 0;\n            padding: 0;\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n            line-height: 1.6;\n            color: #333333;\n            background-color: #f8f9fa;\n        }\n        .container {\n            max-width: 600px;\n            margin: 0 auto;\n            background-color: #ffffff;\n            border-radius: 8px;\n            overflow: hidden;\n            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n        }\n        .header {\n            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);\n            color: white;\n            padding: 30px 40px;\n            text-align: center;\n        }\n        .header h1 {\n            margin: 0;\n            font-size: 28px;\n            font-weight: bold;\n        }\n        .header .tagline {\n            margin: 8px 0 0 0;\n            font-size: 16px;\n            opacity: 0.9;\n        }\n        .content {\n            padding: 40px;\n        }\n        .content h2 {\n            color: #ff6b35;\n            font-size: 24px;\n            margin: 0 0 20px 0;\n        }\n        .content p {\n            margin: 0 0 16px 0;\n            font-size: 16px;\n            line-height: 1.6;\n        }\n        .highlight-box {\n            background-color: #fff8f5;\n            border-left: 4px solid #ff6b35;\n            padding: 20px;\n            margin: 20px 0;\n            border-radius: 4px;\n        }\n        .features {\n            margin: 30px 0;\n        }\n        .feature {\n            display: flex;\n            align-items: flex-start;\n            margin-bottom: 16px;\n            padding: 12px 0;\n        }\n        .feature-icon {\n            background-color: #ff6b35;\n            color: white;\n            width: 24px;\n            height: 24px;\n            border-radius: 50%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-weight: bold;\n            font-size: 14px;\n            margin-right: 16px;\n            flex-shrink: 0;\n        }\n        .feature-text {\n            flex: 1;\n        }\n        .feature-title {\n            font-weight: 600;\n            color: #333;\n            margin-bottom: 4px;\n        }\n        .feature-desc {\n            color: #666;\n            font-size: 14px;\n        }\n        .cta-button {\n            display: inline-block;\n            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);\n            color: white;\n            padding: 14px 32px;\n            text-decoration: none;\n            border-radius: 6px;\n            font-weight: 600;\n            margin: 20px 0;\n            text-align: center;\n        }\n        .footer {\n            background-color: #f8f9fa;\n            padding: 30px 40px;\n            text-align: center;\n            border-top: 1px solid #e9ecef;\n        }\n        .footer p {\n            margin: 0;\n            font-size: 14px;\n            color: #666;\n        }\n        .footer .social-links {\n            margin: 20px 0 10px 0;\n        }\n        .footer .social-links a {\n            color: #ff6b35;\n            text-decoration: none;\n            margin: 0 8px;\n            font-size: 14px;\n        }\n        @media (max-width: 600px) {\n            .container {\n                margin: 0;\n                border-radius: 0;\n            }\n            .header, .content, .footer {\n                padding: 20px;\n            }\n            .header h1 {\n                font-size: 24px;\n            }\n            .content h2 {\n                font-size: 20px;\n            }\n            .feature {\n                flex-direction: column;\n                align-items: flex-start;\n            }\n            .feature-icon {\n                margin-bottom: 8px;\n            }\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <h1>\uD83C\uDF7D\uFE0F MealScout</h1>\n            <div class=\"tagline\">Discover Amazing Food Deals</div>\n        </div>\n        <div class=\"content\">\n            ").concat(content, "\n        </div>\n        <div class=\"footer\">\n            <div class=\"social-links\">\n                <a href=\"#\" target=\"_blank\">Facebook</a>\n                <a href=\"#\" target=\"_blank\">Instagram</a>\n                <a href=\"#\" target=\"_blank\">Twitter</a>\n            </div>\n            <p>\u00A9 2025 MealScout. All rights reserved.</p>\n            <p>This email was sent to you because you signed up for MealScout.</p>\n        </div>\n    </div>\n</body>\n</html>");
    };
    EmailTemplates.getVerificationBlock = function (verifyUrl) {
        return {
            html: "\n        <div class=\"highlight-box\">\n          <strong>Verify your email</strong><br>\n          Please confirm your email to activate your account.\n          <p style=\"margin: 16px 0;\">\n            <a href=\"".concat(verifyUrl, "\" style=\"background: #f97316; color: #fff; text-decoration: none; padding: 12px 16px; border-radius: 8px; display: inline-block;\">\n              Verify Email\n            </a>\n          </p>\n          <p style=\"word-break: break-all; color: #f97316;\">").concat(verifyUrl, "</p>\n        </div>\n      "),
            text: "Verify your email to activate your account: ".concat(verifyUrl),
        };
    };
    EmailTemplates.getCustomerWelcomeTemplate = function (user, verifyUrl) {
        var verification = verifyUrl
            ? this.getVerificationBlock(verifyUrl)
            : null;
        var content = "\n      <h2>Welcome to Your Food Adventure! \uD83C\uDF89</h2>\n      <p>Hey ".concat(user.firstName || "Food Explorer", "!</p>\n      ").concat(verification ? verification.html : "", "\n      <p>Welcome to MealScout \u2013 your personal guide to discovering incredible food deals around you! We're thrilled to have you join our community of savvy food lovers.</p>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83C\uDFAF What makes MealScout special?</strong><br>\n        We connect you with exclusive deals from local restaurants, food trucks, and cafes that you won't find anywhere else!\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDD25</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Exclusive Deals</div>\n            <div class=\"feature-desc\">Access restaurant deals up to 50% off your favorite meals</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDCCD</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Location-Based Discovery</div>\n            <div class=\"feature-desc\">Find amazing food deals right in your neighborhood</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDE9A</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Food Truck Tracker</div>\n            <div class=\"feature-desc\">Never miss your favorite food truck with real-time location updates</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\u2B50</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Personalized Recommendations</div>\n            <div class=\"feature-desc\">Discover new restaurants based on your preferences and reviews</div>\n          </div>\n        </div>\n      </div>\n\n      <p><strong>Ready to start saving?</strong> Open the MealScout app and start exploring delicious deals in your area. Your taste buds (and wallet) will thank you!</p>\n\n      <p>Happy eating!<br>\n      The MealScout Team \uD83C\uDF7D\uFE0F</p>\n    ");
        var html = this.getBaseTemplate("Welcome to MealScout!", content);
        var text = "Welcome to MealScout, ".concat(user.firstName || "Food Explorer", "!\n").concat(verification ? "\n".concat(verification.text, "\n") : "", "\n\nWe're thrilled to have you join our community of savvy food lovers. MealScout connects you with exclusive deals from local restaurants, food trucks, and cafes.\n\nWhat you can expect:\n\u2022 Exclusive deals up to 50% off your favorite meals\n\u2022 Location-based discovery of nearby food deals\n\u2022 Real-time food truck tracking\n\u2022 Personalized restaurant recommendations\n\nReady to start saving? Open the MealScout app and start exploring delicious deals in your area.\n\nHappy eating!\nThe MealScout Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getRestaurantOwnerWelcomeTemplate = function (user, verifyUrl) {
        var verification = verifyUrl
            ? this.getVerificationBlock(verifyUrl)
            : null;
        var content = "\n      <h2>Welcome to MealScout Business! \uD83D\uDE80</h2>\n      <p>Hello ".concat(user.firstName || "Business Owner", "!</p>\n      ").concat(verification ? verification.html : "", "\n      <p>Congratulations on joining MealScout! You're now part of a powerful platform that connects local restaurants with hungry customers looking for amazing deals.</p>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83C\uDFAF Grow Your Business with MealScout</strong><br>\n        Our platform helps you attract new customers, fill empty tables during slow hours, and boost your revenue with strategic deal campaigns.\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDCC8</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Increase Revenue</div>\n            <div class=\"feature-desc\">Create targeted deals to drive sales during slow periods and attract new customers</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDFAF</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Smart Deal Management</div>\n            <div class=\"feature-desc\">Set time limits, usage limits, and track performance with detailed analytics</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDC65</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Customer Discovery</div>\n            <div class=\"feature-desc\">Reach food lovers in your area who are actively looking for great deals</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDCCA</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Performance Analytics</div>\n            <div class=\"feature-desc\">Track deal performance, customer engagement, and ROI with detailed insights</div>\n          </div>\n        </div>\n      </div>\n\n      <p><strong>Next Steps:</strong></p>\n      <p>1. Complete your restaurant profile with photos and details<br>\n      2. Create your first deal to attract customers<br>\n      3. Monitor performance and optimize your campaigns</p>\n\n      <p>Our support team is here to help you succeed. If you have any questions, don't hesitate to reach out!</p>\n\n      <p>Here's to your business growth!<br>\n      The MealScout Business Team \uD83D\uDCBC</p>\n    ");
        var html = this.getBaseTemplate("Welcome to MealScout Business!", content);
        var text = "Welcome to MealScout Business, ".concat(user.firstName || "Business Owner", "!\n").concat(verification ? "\n".concat(verification.text, "\n") : "", "\n\nCongratulations on joining MealScout! You're now part of a powerful platform that connects local restaurants with hungry customers.\n\nWhat MealScout Business offers:\n\u2022 Increase revenue with strategic deal campaigns\n\u2022 Smart deal management with limits and analytics\n\u2022 Reach customers actively looking for deals\n\u2022 Performance analytics and insights\n\nNext Steps:\n1. Complete your restaurant profile with photos and details\n2. Create your first deal to attract customers\n3. Monitor performance and optimize your campaigns\n\nOur support team is here to help you succeed!\n\nHere's to your business growth!\nThe MealScout Business Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getAdminWelcomeTemplate = function (user, verifyUrl) {
        var verification = verifyUrl
            ? this.getVerificationBlock(verifyUrl)
            : null;
        var content = "\n      <h2>Admin Access Granted \uD83D\uDD10</h2>\n      <p>Hello ".concat(user.firstName || "Admin", "!</p>\n      ").concat(verification ? verification.html : "", "\n      <p>Your MealScout admin account has been created successfully. You now have access to the administrative dashboard and all management features.</p>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83D\uDEE0\uFE0F Admin Capabilities</strong><br>\n        Monitor platform activity, manage users and restaurants, review verification requests, and oversee system operations.\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDC65</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">User Management</div>\n            <div class=\"feature-desc\">Manage customer and restaurant owner accounts</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDFEA</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Restaurant Oversight</div>\n            <div class=\"feature-desc\">Review verification requests and manage restaurant listings</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDCCA</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Platform Analytics</div>\n            <div class=\"feature-desc\">Monitor platform performance, user engagement, and system health</div>\n          </div>\n        </div>\n      </div>\n\n      <p>Access your admin dashboard to get started with platform management.</p>\n\n      <p>Best regards,<br>\n      The MealScout Development Team \u2699\uFE0F</p>\n    ");
        var html = this.getBaseTemplate("MealScout Admin Access", content);
        var text = "MealScout Admin Access Granted\n\n".concat(verification ? "".concat(verification.text, "\n") : "", "\n\nHello ").concat(user.firstName || "Admin", "!\n\nYour MealScout admin account has been created successfully. You now have access to the administrative dashboard and all management features.\n\nAdmin Capabilities:\n\u2022 User management for customers and restaurant owners\n\u2022 Restaurant oversight and verification requests\n\u2022 Platform analytics and system monitoring\n\nAccess your admin dashboard to get started.\n\nBest regards,\nThe MealScout Development Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getPaymentConfirmationTemplate = function (user, amount, interval, subscriptionId) {
        var content = "\n      <h2>Payment Confirmation \uD83D\uDCB3</h2>\n      <p>Hello ".concat(user.firstName || "Valued Customer", "!</p>\n      <p>Thank you for your payment! Your MealScout subscription has been successfully processed.</p>\n\n      <div class=\"highlight-box\">\n        <strong>Payment Details</strong><br>\n        Amount: $").concat((amount / 100).toFixed(2), "<br>\n        Billing Cycle: ").concat(interval === "month" ? "Monthly" : interval === "3-month" ? "Quarterly" : "Yearly", "<br>\n        Subscription ID: ").concat(subscriptionId, "\n      </div>\n\n      <p>Your premium features are now active and you can enjoy:</p>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDFAF</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Priority Access</div>\n            <div class=\"feature-desc\">Get early access to the best deals before they sell out</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDD14</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Smart Notifications</div>\n            <div class=\"feature-desc\">Receive personalized deal alerts based on your preferences</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\u2B50</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Premium Support</div>\n            <div class=\"feature-desc\">Priority customer support and exclusive member benefits</div>\n          </div>\n        </div>\n      </div>\n\n      <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.</p>\n\n      <p>Thank you for being a valued MealScout member!<br>\n      The MealScout Team \uD83D\uDC96</p>\n    ");
        var html = this.getBaseTemplate("Payment Confirmation - MealScout", content);
        var text = "MealScout Payment Confirmation\n\nHello ".concat(user.firstName || "Valued Customer", "!\n\nThank you for your payment! Your MealScout subscription has been successfully processed.\n\nPayment Details:\nAmount: $").concat((amount / 100).toFixed(2), "\nBilling Cycle: ").concat(interval === "month" ? "Monthly" : interval === "3-month" ? "Quarterly" : "Yearly", "\nSubscription ID: ").concat(subscriptionId, "\n\nYour premium features are now active:\n\u2022 Priority access to the best deals\n\u2022 Smart personalized notifications\n\u2022 Premium customer support\n\nThank you for being a valued MealScout member!\nThe MealScout Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getAdminNotificationTemplate = function (user, restaurant) {
        var userTypeDisplay = user.userType === "customer"
            ? "Customer"
            : user.userType === "restaurant_owner"
                ? "Restaurant Owner"
                : "Admin";
        var locationInfo = "";
        if (restaurant) {
            locationInfo = "\n        <strong>Restaurant Details:</strong><br>\n        Name: ".concat(restaurant.name, "<br>\n        Address: ").concat(restaurant.address, "<br>\n        Phone: ").concat(restaurant.phone || "Not provided", "<br>\n        Business Type: ").concat(restaurant.businessType, "<br>\n        Cuisine: ").concat(restaurant.cuisineType || "Not specified", "<br>\n        ").concat(restaurant.isFoodTruck ? "Food Truck: Yes" : "", "\n      ");
        }
        var content = "\n      <h2>New User Registration Alert \uD83D\uDD14</h2>\n      <p>A new user has joined MealScout!</p>\n\n      <div class=\"highlight-box\">\n        <strong>User Information:</strong><br>\n        Name: ".concat(user.firstName || "", " ").concat(user.lastName || "", "<br>\n        Email: ").concat(user.email, "<br>\n        User Type: ").concat(userTypeDisplay, "<br>\n        Registration Date: ").concat(new Date().toLocaleDateString(), "<br>\n        ").concat(locationInfo, "\n      </div>\n\n      <p>This notification was generated automatically by the MealScout system.</p>\n    ");
        var html = this.getBaseTemplate("New User Registration - MealScout Admin", content);
        var text = "New User Registration Alert\n\nA new user has joined MealScout!\n\nUser Information:\nName: ".concat(user.firstName || "", " ").concat(user.lastName || "", "\nEmail: ").concat(user.email, "\nUser Type: ").concat(userTypeDisplay, "\nRegistration Date: ").concat(new Date().toLocaleDateString(), "\n\n").concat(restaurant
            ? "Restaurant Details:\nName: ".concat(restaurant.name, "\nAddress: ").concat(restaurant.address, "\nPhone: ").concat(restaurant.phone || "Not provided", "\nBusiness Type: ").concat(restaurant.businessType, "\nCuisine: ").concat(restaurant.cuisineType || "Not specified", "\n").concat(restaurant.isFoodTruck ? "Food Truck: Yes" : "")
            : "", "\n\nThis notification was generated automatically by the MealScout system.\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getAdminSignupNotificationTemplate = function (user, context) {
        var userTypeDisplay = user.userType === "customer"
            ? "Customer"
            : user.userType === "restaurant_owner"
                ? "Restaurant Owner"
                : "Admin";
        var signupMethod = (context === null || context === void 0 ? void 0 : context.signupMethod) || "Email";
        var restaurantInfo = "";
        if (context === null || context === void 0 ? void 0 : context.restaurant) {
            restaurantInfo = "\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDFEA</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Restaurant Information</div>\n            <div class=\"feature-desc\">\n              <strong>Name:</strong> ".concat(context.restaurant.name, "<br>\n              <strong>Address:</strong> ").concat(context.restaurant.address, "<br>\n              <strong>Phone:</strong> ").concat(context.restaurant.phone || "Not provided", "<br>\n              <strong>Business Type:</strong> ").concat(context.restaurant.businessType, "<br>\n              <strong>Cuisine Type:</strong> ").concat(context.restaurant.cuisineType || "Not specified", "<br>\n              ").concat(context.restaurant.isFoodTruck ? "<strong>Food Truck:</strong> Yes<br>" : "", "\n              <strong>Verified:</strong> ").concat(context.restaurant.isVerified ? "Yes" : "Pending", "\n            </div>\n          </div>\n        </div>\n      ");
        }
        var content = "\n      <h2>New MealScout Signup \uD83C\uDF89</h2>\n      <p>A new user has registered for MealScout and requires admin attention.</p>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83D\uDCCB User Summary</strong><br>\n        <strong>Name:</strong> ".concat(user.firstName || "", " ").concat(user.lastName || "", "<br>\n        <strong>Email:</strong> ").concat(user.email, "<br>\n        <strong>User Type:</strong> ").concat(userTypeDisplay, "<br>\n        <strong>Signup Method:</strong> ").concat(signupMethod, "<br>\n        <strong>Registration Date:</strong> ").concat(new Date().toLocaleDateString(), "\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDC64</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Account Details</div>\n            <div class=\"feature-desc\">\n              <strong>User ID:</strong> ").concat(user.id || "Pending", "<br>\n              <strong>Account Status:</strong> Active<br>\n              <strong>Email Verified:</strong> ").concat(user.emailVerified ? "Yes" : "Pending", "\n            </div>\n          </div>\n        </div>\n        ").concat(restaurantInfo, "\n      </div>\n\n      ").concat(user.userType === "restaurant_owner"
            ? "\n        <div class=\"highlight-box\" style=\"border-left-color: #f7931e;\">\n          <strong>\u26A0\uFE0F Action Required</strong><br>\n          This restaurant owner account may require verification review before full platform access is granted.\n        </div>\n      "
            : "", "\n\n      <p>You can manage this user account through the MealScout admin dashboard.</p>\n\n      <p>For questions or support, contact our development team.<br>\n      <strong>MealScout Admin System</strong> \uD83D\uDEE0\uFE0F</p>\n    ");
        var html = this.getBaseTemplate("New MealScout Signup", content);
        var text = "New MealScout Signup\n\nA new user has registered for MealScout:\n\nUser Information:\nName: ".concat(user.firstName || "", " ").concat(user.lastName || "", "\nEmail: ").concat(user.email, "\nUser Type: ").concat(userTypeDisplay, "\nSignup Method: ").concat(signupMethod, "\nRegistration Date: ").concat(new Date().toLocaleDateString(), "\nUser ID: ").concat(user.id || "Pending", "\nAccount Status: Active\nEmail Verified: ").concat(user.emailVerified ? "Yes" : "Pending", "\n\n").concat((context === null || context === void 0 ? void 0 : context.restaurant)
            ? "Restaurant Details:\nName: ".concat(context.restaurant.name, "\nAddress: ").concat(context.restaurant.address, "\nPhone: ").concat(context.restaurant.phone || "Not provided", "\nBusiness Type: ").concat(context.restaurant.businessType, "\nCuisine Type: ").concat(context.restaurant.cuisineType || "Not specified", "\n").concat(context.restaurant.isFoodTruck ? "Food Truck: Yes" : "", "\nVerified: ").concat(context.restaurant.isVerified ? "Yes" : "Pending")
            : "", "\n\n").concat(user.userType === "restaurant_owner" ? "ACTION REQUIRED: This restaurant owner account may require verification review." : "", "\n\nYou can manage this user account through the MealScout admin dashboard.\n\nMealScout Admin System\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getPasswordResetTemplate = function (user, resetUrl) {
        var content = "\n      <h2>Reset Your MealScout Password \uD83D\uDD10</h2>\n      <p>Hello ".concat(user.firstName || "MealScout User", "!</p>\n      <p>We received a request to reset the password for your MealScout account. If you made this request, click the button below to create a new password.</p>\n\n      <div style=\"text-align: center; margin: 30px 0;\">\n        <a href=\"").concat(resetUrl, "\" class=\"cta-button\" style=\"display: inline-block;\">Reset My Password</a>\n      </div>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83D\uDEE1\uFE0F Security Information</strong><br>\n        \u2022 This password reset link is valid for <strong>1 hour</strong><br>\n        \u2022 The link can only be used once<br>\n        \u2022 If you didn't request this reset, you can safely ignore this email<br>\n        \u2022 Your current password will remain unchanged until you create a new one\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\u26A0\uFE0F</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Didn't Request This?</div>\n            <div class=\"feature-desc\">If you didn't request a password reset, please ignore this email. Your account remains secure.</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDD12</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Keep Your Account Secure</div>\n            <div class=\"feature-desc\">Choose a strong password with at least 8 characters, including numbers and special characters.</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\u2753</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Need Help?</div>\n            <div class=\"feature-desc\">If you're having trouble accessing your account, contact our support team at info.mealscout@gmail.com</div>\n          </div>\n        </div>\n      </div>\n\n      <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>\n      <span style=\"word-break: break-all; color: #ff6b35; font-size: 14px;\">").concat(resetUrl, "</span></p>\n\n      <p>Best regards,<br>\n      The MealScout Security Team \uD83D\uDD10</p>\n    ");
        var html = this.getBaseTemplate("Reset Your MealScout Password", content);
        var text = "Reset Your MealScout Password\n\nHello ".concat(user.firstName || "MealScout User", "!\n\nWe received a request to reset the password for your MealScout account. If you made this request, use the link below to create a new password.\n\nReset Link: ").concat(resetUrl, "\n\nSecurity Information:\n\u2022 This password reset link is valid for 1 hour\n\u2022 The link can only be used once\n\u2022 If you didn't request this reset, you can safely ignore this email\n\u2022 Your current password will remain unchanged until you create a new one\n\nDidn't Request This?\nIf you didn't request a password reset, please ignore this email. Your account remains secure.\n\nKeep Your Account Secure:\nChoose a strong password with at least 8 characters, including numbers and special characters.\n\nNeed Help?\nIf you're having trouble accessing your account, contact our support team at info.mealscout@gmail.com\n\nBest regards,\nThe MealScout Security Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getAccountSetupTemplate = function (user, setupUrl, createdByName) {
        var _a;
        var greeting = user.firstName || ((_a = user.email) === null || _a === void 0 ? void 0 : _a.split("@")[0]) || "there";
        var createdByText = createdByName ? " by ".concat(createdByName) : "";
        var content = "\n      <h2>Welcome to MealScout! \uD83C\uDF89</h2>\n      <p>Hello ".concat(greeting, "!</p>\n      <p>Your MealScout account has been created").concat(createdByText, ". Let's get you set up! Click the button below to complete your profile:</p>\n\n      <div style=\"text-align: center; margin: 30px 0;\">\n        <a href=\"").concat(setupUrl, "\" class=\"cta-button\" style=\"display: inline-block;\">Complete My Profile</a>\n      </div>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83D\uDCDD What's Next?</strong><br>\n        \u2022 Create your password (minimum 8 characters)<br>\n        \u2022 Upload a profile picture (optional)<br>\n        \u2022 Start exploring exclusive food deals in your area!\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDF9F\uFE0F</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Exclusive Deals</div>\n            <div class=\"feature-desc\">Access special offers from local restaurants and food trucks.</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\u2B50</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Save Favorites</div>\n            <div class=\"feature-desc\">Keep track of your favorite spots and never miss a deal.</div>\n          </div>\n        </div>\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDDFA\uFE0F</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Find Food Trucks</div>\n            <div class=\"feature-desc\">Discover where your favorite food trucks are parked today.</div>\n          </div>\n        </div>\n      </div>\n\n      <div style=\"background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;\">\n        <p style=\"margin: 0; font-size: 14px; color: #666;\">\n          <strong>\u23F0 This setup link expires in 7 days</strong> for your security.\n          If you need a new link, contact our support team at info.mealscout@gmail.com\n        </p>\n      </div>\n\n      <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>\n      <span style=\"word-break: break-all; color: #ff6b35; font-size: 14px;\">").concat(setupUrl, "</span></p>\n\n      <p>Looking forward to helping you discover amazing food!<br>\n      The MealScout Team \uD83C\uDF54\uD83C\uDF2E\uD83C\uDF55</p>\n    ");
        var html = this.getBaseTemplate("Welcome to MealScout!", content);
        var text = "Welcome to MealScout!\n\nHello ".concat(greeting, "!\n\nYour MealScout account has been created").concat(createdByText, ". Let's get you set up!\n\nComplete your profile here: ").concat(setupUrl, "\n\nWhat's Next:\n\u2022 Create your password (minimum 8 characters)\n\u2022 Upload a profile picture (optional)\n\u2022 Start exploring exclusive food deals in your area!\n\nWhy You'll Love MealScout:\n\uD83C\uDF9F\uFE0F Exclusive Deals - Access special offers from local restaurants and food trucks\n\u2B50 Save Favorites - Keep track of your favorite spots and never miss a deal\n\uD83D\uDDFA\uFE0F Find Food Trucks - Discover where your favorite food trucks are parked today\n\n\u23F0 This setup link expires in 7 days for your security. If you need a new link, contact our support team at info.mealscout@gmail.com\n\nCan't click the link? Copy and paste this into your browser:\n").concat(setupUrl, "\n\nLooking forward to helping you discover amazing food!\nThe MealScout Team\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    EmailTemplates.getBugReportTemplate = function (data) {
        var userName = data.userName || "Anonymous User";
        var userEmail = data.userEmail || "Not logged in";
        var content = "\n      <h2>\uD83D\uDC1B Bug Report Received</h2>\n      <p>A bug report has been submitted from the MealScout beta application.</p>\n\n      <div class=\"highlight-box\">\n        <strong>\uD83D\uDCCB Report Details</strong><br>\n        <strong>Submitted by:</strong> ".concat(userName, "<br>\n        <strong>Email:</strong> ").concat(userEmail, "<br>\n        <strong>Timestamp:</strong> ").concat(data.timestamp, "<br>\n        <strong>Page URL:</strong> ").concat(data.currentUrl, "\n      </div>\n\n      <div class=\"features\">\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83C\uDF10</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Browser Information</div>\n            <div class=\"feature-desc\">").concat(data.userAgent, "</div>\n          </div>\n        </div>\n        ").concat(data.screenshotUrl
            ? "\n        <div class=\"feature\">\n          <div class=\"feature-icon\">\uD83D\uDCF8</div>\n          <div class=\"feature-text\">\n            <div class=\"feature-title\">Screenshot Captured</div>\n            <div class=\"feature-desc\">A screenshot has been attached to this report showing the page state when the bug was reported.</div>\n          </div>\n        </div>\n        "
            : "", "\n      </div>\n\n      ").concat(data.screenshotUrl
            ? "\n      <div class=\"highlight-box\" style=\"border-left-color: #10b981;\">\n        <strong>\uD83D\uDCCE Screenshot Attached</strong><br>\n        A screenshot of the page has been attached to this email as \"bug-report-screenshot.png\"\n      </div>\n      "
            : "", "\n\n      <p>This report was automatically generated by the MealScout beta bug reporting system.</p>\n\n      <p>Best regards,<br>\n      MealScout Beta Bug Reporting System \uD83D\uDD27</p>\n    ");
        var html = this.getBaseTemplate("Bug Report - MealScout Beta", content);
        var text = "Bug Report - MealScout Beta\n\nA bug report has been submitted from the MealScout beta application.\n\nReport Details:\nSubmitted by: ".concat(userName, "\nEmail: ").concat(userEmail, "\nTimestamp: ").concat(data.timestamp, "\nPage URL: ").concat(data.currentUrl, "\n\nBrowser Information:\n").concat(data.userAgent, "\n\n").concat(data.screenshotUrl ? "Screenshot: Attached to this email" : "No screenshot attached", "\n\nThis report was automatically generated by the MealScout beta bug reporting system.\n\nBest regards,\nMealScout Beta Bug Reporting System\n\n\u00A9 2025 MealScout. All rights reserved.");
        return { html: html, text: text };
    };
    return EmailTemplates;
}());
// Email service class
var EmailService = /** @class */ (function () {
    function EmailService() {
        this.isConfigured = isEmailConfigured();
    }
    EmailService.getInstance = function () {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    };
    EmailService.prototype.sendEmail = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var notificationMode, emailData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        notificationMode = process.env.EMAIL_NOTIFICATIONS_MODE || "all";
                        if (notificationMode === "account_only" && params.category !== "account") {
                            console.warn("Email skipped for ".concat(params.to, ": ").concat(params.subject, " (category: ").concat(params.category || "general", ")"));
                            return [2 /*return*/, false];
                        }
                        if (!this.isConfigured) {
                            console.warn("Email not sent to ".concat(params.to, ": Brevo not configured"));
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        emailData = {
                            to: [
                                {
                                    email: params.to,
                                },
                            ],
                            sender: {
                                email: EMAIL_CONFIG.fromEmail,
                                name: EMAIL_CONFIG.fromName,
                            },
                            subject: params.subject,
                            htmlContent: params.html,
                            textContent: params.text,
                        };
                        // Add attachments if provided
                        if (params.attachments && params.attachments.length > 0) {
                            emailData.attachment = params.attachments;
                        }
                        return [4 /*yield*/, transactionalEmailsApi.sendTransacEmail(emailData)];
                    case 2:
                        _a.sent();
                        console.log("Email sent successfully to ".concat(params.to, ": ").concat(params.subject));
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Failed to send email to ".concat(params.to, ":"), error_1);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.sendBasicEmail = function (to, subject, html, text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendEmail({ to: to, subject: subject, html: html, text: text })];
            });
        });
    };
    EmailService.prototype.sendEmailVerificationEmail = function (user, verifyUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var subject, html, text;
            return __generator(this, function (_a) {
                subject = "Verify your MealScout email";
                html = "\n      <div style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;\">\n        <h2 style=\"margin-bottom: 8px;\">Verify your email</h2>\n        <p>Thanks for joining MealScout. Please verify your email to activate your account.</p>\n        <p style=\"margin: 16px 0;\">\n          <a href=\"".concat(verifyUrl, "\" style=\"background: #f97316; color: #fff; text-decoration: none; padding: 12px 16px; border-radius: 8px; display: inline-block;\">\n            Verify Email\n          </a>\n        </p>\n        <p>If the button does not work, paste this link into your browser:</p>\n        <p style=\"word-break: break-all; color: #f97316;\">").concat(verifyUrl, "</p>\n      </div>\n    ");
                text = "Verify your MealScout email: ".concat(verifyUrl);
                return [2 /*return*/, this.sendEmail({
                        to: user.email || "",
                        subject: subject,
                        html: html,
                        text: text,
                        category: "account",
                    })];
            });
        });
    };
    // Send welcome email based on user type
    EmailService.prototype.sendWelcomeEmail = function (user, verifyUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var template, subject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        switch (user.userType) {
                            case "customer":
                                template = EmailTemplates.getCustomerWelcomeTemplate(user, verifyUrl);
                                subject =
                                    "Welcome to MealScout - Start Discovering Amazing Food Deals! 🍽️";
                                break;
                            case "restaurant_owner":
                                template = EmailTemplates.getRestaurantOwnerWelcomeTemplate(user, verifyUrl);
                                subject = "Welcome to MealScout Business - Grow Your Restaurant! 🚀";
                                break;
                            case "admin":
                                template = EmailTemplates.getAdminWelcomeTemplate(user, verifyUrl);
                                subject = "MealScout Admin Access Granted 🔐";
                                break;
                            default:
                                console.warn("Unknown user type: ".concat(user.userType));
                                return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.sendEmail({
                                to: user.email,
                                subject: subject,
                                html: template.html,
                                text: template.text,
                                category: "account",
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send payment confirmation email
    EmailService.prototype.sendPaymentConfirmation = function (user, amount, interval, subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getPaymentConfirmationTemplate(user, amount, interval, subscriptionId);
                        return [4 /*yield*/, this.sendEmail({
                                to: user.email,
                                subject: "Payment Confirmation - MealScout Subscription 💳",
                                html: template.html,
                                text: template.text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send admin notification when new user signs up
    EmailService.prototype.sendAdminNotification = function (user, restaurant) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getAdminNotificationTemplate(user, restaurant);
                        return [4 /*yield*/, this.sendEmail({
                                to: EMAIL_CONFIG.adminEmail,
                                subject: "New ".concat(user.userType === "customer" ? "Customer" : user.userType === "restaurant_owner" ? "Restaurant Owner" : "Admin", " Registration - ").concat(user.firstName || "", " ").concat(user.lastName || ""),
                                html: template.html,
                                text: template.text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send admin signup notification with enhanced details
    EmailService.prototype.sendAdminSignupNotification = function (user, context) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getAdminSignupNotificationTemplate(user, context);
                        return [4 /*yield*/, this.sendEmail({
                                to: EMAIL_CONFIG.adminEmail,
                                subject: "New MealScout Signup - ".concat(user.firstName || "", " ").concat(user.lastName || "", " (").concat(user.userType, ")"),
                                html: template.html,
                                text: template.text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send password reset email
    EmailService.prototype.sendPasswordResetEmail = function (user, resetUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getPasswordResetTemplate(user, resetUrl);
                        return [4 /*yield*/, this.sendEmail({
                                to: user.email,
                                subject: "Reset your MealScout password 🔐",
                                html: template.html,
                                text: template.text,
                                category: "account",
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send account setup email for new users
    EmailService.prototype.sendAccountSetupEmail = function (user, setupUrl, createdByName) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getAccountSetupTemplate(user, setupUrl, createdByName);
                        return [4 /*yield*/, this.sendEmail({
                                to: user.email,
                                subject: "Welcome to MealScout! Complete your profile 🎉",
                                html: template.html,
                                text: template.text,
                                category: "account",
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send bug report email
    EmailService.prototype.sendBugReport = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var template, emailParams, base64Match;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        template = EmailTemplates.getBugReportTemplate(data);
                        emailParams = {
                            to: EMAIL_CONFIG.adminEmail,
                            subject: "\uD83D\uDC1B Bug Report - ".concat(data.currentUrl.substring(0, 50)),
                            html: template.html,
                            text: template.text,
                        };
                        // If screenshot is provided, extract base64 data and add as attachment
                        if (data.screenshotUrl) {
                            base64Match = data.screenshotUrl.match(/^data:image\/\w+;base64,(.+)$/);
                            if (base64Match && base64Match[1]) {
                                emailParams.attachments = [
                                    {
                                        content: base64Match[1],
                                        name: "bug-report-screenshot.png",
                                    },
                                ];
                            }
                        }
                        return [4 /*yield*/, this.sendEmail(emailParams)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send interest notification to host
    EmailService.prototype.sendInterestNotification = function (hostEmail, hostName, truckName, eventDate) {
        return __awaiter(this, void 0, void 0, function () {
            var title, content, html, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        title = "New Interest from ".concat(truckName, "!");
                        content = "\n      <p>Hi ".concat(hostName, ",</p>\n      <p>Good news! <strong>").concat(truckName, "</strong> is interested in your event on <strong>").concat(eventDate, "</strong>.</p>\n      <p>Log in to your Host Dashboard to view their profile and manage your event.</p>\n      <div style=\"text-align: center; margin: 30px 0;\">\n        <a href=\"https://mealscout.io/host/dashboard\" style=\"background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;\">View Dashboard</a>\n      </div>\n    ");
                        html = EmailTemplates.getBaseTemplate(title, content);
                        text = "Hi ".concat(hostName, ", ").concat(truckName, " is interested in your event on ").concat(eventDate, ". Log in to view details: https://mealscout.io/host/dashboard");
                        return [4 /*yield*/, this.sendEmail({
                                to: hostEmail,
                                subject: "\uD83D\uDE9A New Interest: ".concat(truckName, " wants to join your event!"),
                                html: html,
                                text: text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send status update notification to truck
    EmailService.prototype.sendInterestStatusUpdate = function (truckEmail, truckName, hostName, eventDate, status) {
        return __awaiter(this, void 0, void 0, function () {
            var isAccepted, title, content, html, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isAccepted = status === "accepted";
                        title = isAccepted
                            ? "You're In! ".concat(hostName, " Accepted Your Request")
                            : "Update on your request for ".concat(hostName);
                        content = isAccepted
                            ? "\n        <p>Hi ".concat(truckName, ",</p>\n        <p>Great news! <strong>").concat(hostName, "</strong> has accepted your request to join their event on <strong>").concat(eventDate, "</strong>.</p>\n        <p>Please contact the host directly if you need to coordinate arrival details.</p>\n        <div style=\"text-align: center; margin: 30px 0;\">\n          <a href=\"https://mealscout.io/truck/discovery\" style=\"background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;\">View Event</a>\n        </div>\n      ")
                            : "\n        <p>Hi ".concat(truckName, ",</p>\n        <p>Thank you for your interest in the event at <strong>").concat(hostName, "</strong> on <strong>").concat(eventDate, "</strong>.</p>\n        <p>The host has declined your request at this time. Don't worry, there are plenty of other locations looking for great food trucks!</p>\n        <div style=\"text-align: center; margin: 30px 0;\">\n          <a href=\"https://mealscout.io/truck/discovery\" style=\"background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;\">Find More Events</a>\n        </div>\n      ");
                        html = EmailTemplates.getBaseTemplate(title, content);
                        text = isAccepted
                            ? "Hi ".concat(truckName, ", ").concat(hostName, " has accepted your request for ").concat(eventDate, "!")
                            : "Hi ".concat(truckName, ", ").concat(hostName, " has declined your request for ").concat(eventDate, ".");
                        return [4 /*yield*/, this.sendEmail({
                                to: truckEmail,
                                subject: isAccepted
                                    ? "\uD83C\uDF89 You're In! ".concat(hostName, " Accepted Your Request")
                                    : "Update on your request for ".concat(hostName),
                                html: html,
                                text: text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Send weekly digest to host
    EmailService.prototype.sendWeeklyDigest = function (hostEmail, data) {
        return __awaiter(this, void 0, void 0, function () {
            var title, eventsHtml, alertsHtml, content, html, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        title = "Your MealScout Week at a Glance";
                        eventsHtml = "";
                        if (data.events.length > 0) {
                            eventsHtml = "\n        <h3 style=\"color: #1e293b; margin-top: 20px;\">\uD83D\uDCC5 Upcoming Events</h3>\n        <ul style=\"padding-left: 0; list-style: none;\">\n          ".concat(data.events
                                .map(function (e) { return "\n            <li style=\"margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;\">\n              <div style=\"font-weight: bold; color: #0f172a;\">".concat(e.date, " - ").concat(e.name, "</div>\n              <div style=\"font-size: 14px; color: #64748b; margin-top: 4px;\">\n                Capacity: ").concat(e.accepted, " / ").concat(e.max, " trucks\n              </div>\n            </li>\n          "); })
                                .join(""), "\n        </ul>\n      ");
                        }
                        alertsHtml = "";
                        if (data.capacityAlerts.length > 0) {
                            alertsHtml = "\n        <div style=\"margin-top: 20px; padding: 16px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px;\">\n          <h3 style=\"color: #92400e; margin-top: 0; font-size: 16px;\">\u26A0\uFE0F Capacity Alerts</h3>\n          <p style=\"color: #b45309; font-size: 14px; margin-bottom: 8px;\">The following events are at or over capacity:</p>\n          <ul style=\"padding-left: 20px; margin-bottom: 0; color: #92400e;\">\n            ".concat(data.capacityAlerts.map(function (a) { return "<li>".concat(a.date, ": ").concat(a.eventName, " (").concat(a.accepted, "/").concat(a.max, ")</li>"); }).join(""), "\n          </ul>\n        </div>\n      ");
                        }
                        content = "\n      <p>Hi ".concat(data.hostName, ",</p>\n      <p>Here is your summary for the week of <strong>").concat(data.weekStart, "</strong> to <strong>").concat(data.weekEnd, "</strong>.</p>\n\n      ").concat(data.pendingCount > 0
                            ? "\n        <div style=\"margin: 20px 0; padding: 16px; background-color: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;\">\n          <div style=\"font-size: 18px; font-weight: bold; color: #1e40af;\">".concat(data.pendingCount, " Pending Interest").concat(data.pendingCount !== 1 ? "s" : "", "</div>\n          <div style=\"color: #1e3a8a;\">Trucks are waiting for your response.</div>\n        </div>\n      ")
                            : "", "\n\n      ").concat(alertsHtml, "\n      ").concat(eventsHtml, "\n\n      <div style=\"text-align: center; margin: 30px 0;\">\n        <a href=\"https://mealscout.io/host/dashboard\" style=\"background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;\">Go to Dashboard</a>\n      </div>\n\n      <p style=\"font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;\">\n        This is an informational summary. Actions available in your dashboard.\n      </p>\n    ");
                        html = EmailTemplates.getBaseTemplate(title, content);
                        text = "Hi ".concat(data.hostName, ", here is your weekly summary. You have ").concat(data.pendingCount, " pending interests. Log in to view details: https://mealscout.io/host/dashboard");
                        return [4 /*yield*/, this.sendEmail({
                                to: hostEmail,
                                subject: title,
                                html: html,
                                text: text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Utility method to check if email service is available
    EmailService.prototype.isAvailable = function () {
        return this.isConfigured;
    };
    /**
     * Send notification to a truck owner when a series they're interested in gets cancelled
     * @param truckEmail - Email of the truck owner
     * @param truckName - Name of the food truck
     * @param seriesName - Name of the event series
     * @param affectedDates - Array of date strings for cancelled occurrences
     */
    EmailService.prototype.sendSeriesCancellationNotification = function (truckEmail, truckName, seriesName, affectedDates) {
        return __awaiter(this, void 0, void 0, function () {
            var dateList, title, content, html, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConfigured) {
                            console.warn("Email service not configured. Skipping series cancellation notification.");
                            return [2 /*return*/, false];
                        }
                        dateList = affectedDates.length <= 5
                            ? affectedDates.map(function (d) { return "<li>".concat(d, "</li>"); }).join("")
                            : "<li>".concat(affectedDates[0], "</li><li>").concat(affectedDates[1], "</li><li>").concat(affectedDates[2], "</li><li>... and ").concat(affectedDates.length - 3, " more dates</li>");
                        title = "Event Series Cancelled: ".concat(seriesName);
                        content = "\n      <p>Hi ".concat(truckName, " Team,</p>\n\n      <p>We wanted to let you know that the event series <strong>\"").concat(seriesName, "\"</strong> has been cancelled by the host.</p>\n\n      <div style=\"margin: 20px 0; padding: 16px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;\">\n        <div style=\"font-size: 18px; font-weight: bold; color: #991b1b;\">Series Cancelled</div>\n        <div style=\"color: #7f1d1d; margin-top: 8px;\">The following dates are affected:</div>\n        <ul style=\"color: #7f1d1d; margin: 10px 0;\">\n          ").concat(dateList, "\n        </ul>\n      </div>\n\n      <p>If you had marked interest or accepted any of these events, they have been automatically removed from your schedule.</p>\n\n      <p>We appreciate your understanding and look forward to connecting you with other great hosting opportunities!</p>\n\n      <div style=\"text-align: center; margin: 30px 0;\">\n        <a href=\"https://mealscout.io/truck/dashboard\" style=\"background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;\">View Available Events</a>\n      </div>\n\n      <p style=\"font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px;\">\n        Questions? Reply to this email or contact support@mealscout.io\n      </p>\n    ");
                        html = EmailTemplates.getBaseTemplate(title, content);
                        text = "Hi ".concat(truckName, " Team,\n\nThe event series \"").concat(seriesName, "\" has been cancelled by the host.\n\nAffected dates:\n").concat(affectedDates.join("\n"), "\n\nIf you had marked interest or accepted any of these events, they have been removed from your schedule.\n\nView other available events: https://mealscout.io/truck/dashboard");
                        return [4 /*yield*/, this.sendEmail({
                                to: truckEmail,
                                subject: title,
                                html: html,
                                text: text,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return EmailService;
}());
export { EmailService };
export function renderAdminSignupEmail(user, context) {
    return EmailTemplates.getAdminSignupNotificationTemplate(user, context);
}
export function renderPasswordResetEmail(user, resetUrl) {
    return EmailTemplates.getPasswordResetTemplate(user, resetUrl);
}
// Export singleton instance
export var emailService = EmailService.getInstance();

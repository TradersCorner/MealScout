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
import { emailService } from './emailService.js';
import { storage } from './storage.js';
/**
 * Send Golden Fork award notification email
 */
export function sendGoldenForkAwardEmail(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, subject, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user || !user.email)
                        return [2 /*return*/];
                    subject = '🍴 Congratulations! You\'ve Earned the Golden Fork Award!';
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n        .badge { font-size: 48px; margin-bottom: 10px; }\n        .content { background: #fff; padding: 30px; border: 2px solid #f59e0b; border-top: none; border-radius: 0 0 10px 10px; }\n        .stats { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }\n        .stat-item { margin: 10px 0; }\n        .stat-label { font-weight: bold; color: #92400e; }\n        .cta { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }\n        .benefits { list-style: none; padding: 0; }\n        .benefits li { padding: 10px 0; border-bottom: 1px solid #fef3c7; }\n        .benefits li:before { content: \"\u2713 \"; color: #f59e0b; font-weight: bold; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <div class=\"badge\">\uD83C\uDF74</div>\n          <h1>Golden Fork Award!</h1>\n          <p>You're Now an Official MealScout Food Reviewer</p>\n        </div>\n        <div class=\"content\">\n          <p>Hi ".concat(user.firstName || 'Food Lover', ",</p>\n          \n          <p>We're thrilled to announce that you've earned the prestigious <strong>Golden Fork Award</strong>! Your passion for discovering and reviewing great food has made you an influential member of the MealScout community.</p>\n          \n          <div class=\"stats\">\n            <h3 style=\"margin-top: 0; color: #92400e;\">Your Achievement Stats:</h3>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Reviews Written:</span> ").concat(user.reviewCount || 0, "\n            </div>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Recommendations Made:</span> ").concat(user.recommendationCount || 0, "\n            </div>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Influence Score:</span> ").concat(user.influenceScore || 0, "\n            </div>\n          </div>\n\n          <h3>Golden Fork Benefits:</h3>\n          <ul class=\"benefits\">\n            <li>Your reviews and recommendations appear first in listings</li>\n            <li>Special Golden Fork badge on your profile</li>\n            <li>Increased visibility in the MealScout community</li>\n            <li>Early access to new features</li>\n            <li>Priority customer support</li>\n          </ul>\n\n          <p style=\"text-align: center;\">\n            <a href=\"").concat(process.env.PUBLIC_BASE_URL, "/profile\" class=\"cta\">View Your Profile</a>\n          </p>\n\n          <p>Keep sharing your culinary adventures and helping others discover amazing food!</p>\n\n          <p>Cheers,<br>The MealScout Team</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(user.email, subject, html)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Send Golden Plate award notification email to restaurant owner
 */
export function sendGoldenPlateAwardEmail(restaurantId) {
    return __awaiter(this, void 0, void 0, function () {
        var restaurant, owner, subject, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                case 1:
                    restaurant = _a.sent();
                    if (!restaurant)
                        return [2 /*return*/];
                    return [4 /*yield*/, storage.getUser(restaurant.ownerId)];
                case 2:
                    owner = _a.sent();
                    if (!owner || !owner.email)
                        return [2 /*return*/];
                    subject = '🏆 Congratulations! Your Restaurant Won the Golden Plate Award!';
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n        .badge { font-size: 48px; margin-bottom: 10px; }\n        .content { background: #fff; padding: 30px; border: 2px solid #d97706; border-top: none; border-radius: 0 0 10px 10px; }\n        .stats { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }\n        .stat-item { margin: 10px 0; }\n        .stat-label { font-weight: bold; color: #92400e; }\n        .cta { background: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }\n        .benefits { list-style: none; padding: 0; }\n        .benefits li { padding: 10px 0; border-bottom: 1px solid #fef3c7; }\n        .benefits li:before { content: \"\u2605 \"; color: #d97706; font-weight: bold; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <div class=\"badge\">\uD83C\uDFC6</div>\n          <h1>Golden Plate Award Winner!</h1>\n          <p>Top Restaurant in Your Area</p>\n        </div>\n        <div class=\"content\">\n          <p>Dear ".concat(owner.firstName || 'Restaurant Owner', ",</p>\n          \n          <p>Congratulations! <strong>").concat(restaurant.name, "</strong> has been awarded the prestigious <strong>Golden Plate Award</strong> for this quarter!</p>\n          \n          <p>Your restaurant has been recognized as one of the top-performing establishments in your area based on customer recommendations, favorites, reviews, and overall excellence.</p>\n          \n          <div class=\"stats\">\n            <h3 style=\"margin-top: 0; color: #92400e;\">Your Achievement:</h3>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Ranking Score:</span> ").concat(restaurant.rankingScore || 0, "\n            </div>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Total Golden Plates:</span> ").concat(restaurant.goldenPlateCount || 1, "\n            </div>\n            <div class=\"stat-item\">\n              <span class=\"stat-label\">Award Date:</span> ").concat(new Date().toLocaleDateString(), "\n            </div>\n          </div>\n\n          <h3>Golden Plate Benefits:</h3>\n          <ul class=\"benefits\">\n            <li>Your restaurant appears first in local search results</li>\n            <li>Featured on the Golden Plate Winners showcase page</li>\n            <li>Golden Plate badge displayed on your profile</li>\n            <li>This award is permanent and stays with you forever</li>\n            <li>Increased visibility to thousands of food lovers</li>\n            <li>Marketing materials to promote your award</li>\n          </ul>\n\n          <p style=\"text-align: center;\">\n            <a href=\"").concat(process.env.PUBLIC_BASE_URL, "/restaurant-owner-dashboard\" class=\"cta\">View Your Dashboard</a>\n          </p>\n\n          <p>Thank you for your commitment to excellence. Keep up the amazing work!</p>\n\n          <p>Best regards,<br>The MealScout Team</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(owner.email, subject, html)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Send deal claimed notification to restaurant owner
 */
export function sendDealClaimedNotification(dealId, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var deal, restaurant, owner, customer, subject, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getDeal(dealId)];
                case 1:
                    deal = _a.sent();
                    if (!deal)
                        return [2 /*return*/];
                    return [4 /*yield*/, storage.getRestaurant(deal.restaurantId)];
                case 2:
                    restaurant = _a.sent();
                    if (!restaurant)
                        return [2 /*return*/];
                    return [4 /*yield*/, storage.getUser(restaurant.ownerId)];
                case 3:
                    owner = _a.sent();
                    return [4 /*yield*/, storage.getUser(userId)];
                case 4:
                    customer = _a.sent();
                    if (!owner || !owner.email)
                        return [2 /*return*/];
                    subject = "\uD83C\uDF89 New Deal Claimed: ".concat(deal.title);
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { background: #fff; padding: 20px; border: 1px solid #d1d5db; border-top: none; border-radius: 0 0 8px 8px; }\n        .deal-info { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }\n        .cta { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 15px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h2 style=\"margin: 0;\">New Deal Claimed! \uD83C\uDF89</h2>\n        </div>\n        <div class=\"content\">\n          <p>Hi ".concat(owner.firstName || 'Restaurant Owner', ",</p>\n          \n          <p>Great news! A customer just claimed one of your deals:</p>\n          \n          <div class=\"deal-info\">\n            <h3 style=\"margin-top: 0;\">").concat(deal.title, "</h3>\n            <p><strong>Deal:</strong> ").concat(deal.discountValue, "% off</p>\n            <p><strong>Customer:</strong> ").concat((customer === null || customer === void 0 ? void 0 : customer.firstName) || 'Customer', " ").concat((customer === null || customer === void 0 ? void 0 : customer.lastName) || '', "</p>\n            <p><strong>Claimed:</strong> ").concat(new Date().toLocaleString(), "</p>\n          </div>\n\n          <p>Make sure to provide excellent service when this customer visits!</p>\n\n          <p style=\"text-align: center;\">\n            <a href=\"").concat(process.env.PUBLIC_BASE_URL, "/restaurant-owner-dashboard\" class=\"cta\">View All Claims</a>\n          </p>\n\n          <p>Best,<br>MealScout</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(owner.email, subject, html)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Send welcome email to new users
 */
export function sendWelcomeEmail(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, subject, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(userId)];
                case 1:
                    user = _a.sent();
                    if (!user || !user.email)
                        return [2 /*return*/];
                    subject = 'Welcome to MealScout! 🍽️';
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }\n        .features { display: grid; gap: 15px; margin: 20px 0; }\n        .feature { background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; }\n        .cta { background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h1 style=\"margin: 0;\">Welcome to MealScout! \uD83C\uDF7D\uFE0F</h1>\n          <p style=\"margin: 10px 0 0 0;\">Discover Amazing Food Deals Near You</p>\n        </div>\n        <div class=\"content\">\n          <p>Hi ".concat(user.firstName || 'Food Lover', ",</p>\n          \n          <p>Welcome to MealScout! We're excited to have you join our community of food enthusiasts.</p>\n\n          <div class=\"features\">\n            <div class=\"feature\">\n              <strong>\uD83D\uDD0D Discover Deals</strong><br>\n              Find exclusive deals and discounts at local restaurants\n            </div>\n            <div class=\"feature\">\n              <strong>\u2B50 Write Reviews</strong><br>\n              Share your experiences and earn the Golden Fork award\n            </div>\n            <div class=\"feature\">\n              <strong>\u2764\uFE0F Save Favorites</strong><br>\n              Keep track of your favorite restaurants and get notified of new deals\n            </div>\n            <div class=\"feature\">\n              <strong>\uD83D\uDE9A Track Food Trucks</strong><br>\n              See real-time locations of food trucks in your area\n            </div>\n          </div>\n\n          <p style=\"text-align: center;\">\n            <a href=\"").concat(process.env.PUBLIC_BASE_URL, "\" class=\"cta\">Start Exploring Deals</a>\n          </p>\n\n          <p>If you have any questions, just reply to this email!</p>\n\n          <p>Happy eating!<br>The MealScout Team</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(user.email, subject, html)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function sendTruckInterestNotification(locationRequest, restaurantId, message) {
    return __awaiter(this, void 0, void 0, function () {
        var host, restaurant, owner, subject, preferredDates, hostMessage, contactLine, html;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getUser(locationRequest.postedByUserId)];
                case 1:
                    host = _a.sent();
                    if (!(host === null || host === void 0 ? void 0 : host.email))
                        return [2 /*return*/];
                    return [4 /*yield*/, storage.getRestaurant(restaurantId)];
                case 2:
                    restaurant = _a.sent();
                    if (!restaurant)
                        return [2 /*return*/];
                    return [4 /*yield*/, storage.getUser(restaurant.ownerId)];
                case 3:
                    owner = _a.sent();
                    subject = "".concat(restaurant.name, " wants to bring their truck to ").concat(locationRequest.businessName);
                    preferredDates = Array.isArray(locationRequest.preferredDates)
                        ? locationRequest.preferredDates.join(', ')
                        : '';
                    hostMessage = (message === null || message === void 0 ? void 0 : message.trim()) ? "<p style=\"background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e5e7eb;\"><strong>Message from the truck:</strong><br>".concat(message.trim(), "</p>") : '';
                    contactLine = (owner === null || owner === void 0 ? void 0 : owner.email)
                        ? "<p style=\"margin:12px 0 0 0;\"><strong>Contact:</strong> ".concat(owner.email, "</p>")
                        : '';
                    html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }\n        .container { max-width: 640px; margin: 0 auto; padding: 20px; }\n        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #ffffff; }\n        .badge { display: inline-block; background: #fee2e2; color: #b91c1c; padding: 6px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; }\n        .meta { display: grid; gap: 8px; margin: 16px 0; }\n        .meta div { display: flex; justify-content: space-between; }\n        .label { color: #6b7280; font-size: 14px; }\n        .value { font-weight: 600; color: #111827; }\n        .footnote { color: #6b7280; font-size: 12px; margin-top: 16px; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"card\">\n          <div style=\"display:flex;align-items:center;gap:8px;\">\n            <span class=\"badge\">New truck interest</span>\n          </div>\n          <h2 style=\"margin:16px 0 8px 0;\">".concat(restaurant.name, " wants to park at ").concat(locationRequest.businessName, "</h2>\n          <p style=\"margin:0 0 12px 0;\">You received this because you posted a spot for food trucks on MealScout.</p>\n\n          <div class=\"meta\">\n            <div><span class=\"label\">Location type</span><span class=\"value\">").concat(locationRequest.locationType, "</span></div>\n            <div><span class=\"label\">Address</span><span class=\"value\">").concat(locationRequest.address, "</span></div>\n            <div><span class=\"label\">Preferred dates</span><span class=\"value\">").concat(preferredDates || 'No dates specified', "</span></div>\n            <div><span class=\"label\">Expected foot traffic</span><span class=\"value\">").concat(locationRequest.expectedFootTraffic, "</span></div>\n          </div>\n\n          ").concat(hostMessage, "\n          <p style=\"margin:12px 0 0 0;\"><strong>Truck:</strong> ").concat(restaurant.name, "</p>\n          ").concat(contactLine, "\n\n          <p class=\"footnote\">MealScout does not broker or guarantee bookings. Coordinate directly with the truck to confirm details.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
                    return [4 /*yield*/, emailService.sendBasicEmail(host.email, subject, html)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}


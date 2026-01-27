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
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Facebook, Twitter, MessageCircle, Mail, Check } from "lucide-react";
import { getAffiliateShareUrl } from "@/lib/share";
export default function DealShareModal(_a) {
    var _this = this;
    var _b, _c, _d;
    var isOpen = _a.isOpen, onClose = _a.onClose, deal = _a.deal;
    var _e = useState(false), copied = _e[0], setCopied = _e[1];
    var _f = useState(function () {
        if (typeof window === "undefined")
            return "/deal/".concat(deal.id);
        return "".concat(window.location.origin, "/deal/").concat(deal.id);
    }), shareUrl = _f[0], setShareUrl = _f[1];
    var toast = useToast().toast;
    useEffect(function () {
        if (!isOpen)
            return;
        var isActive = true;
        var loadShareUrl = function () { return __awaiter(_this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getAffiliateShareUrl("/deal/".concat(deal.id))];
                    case 1:
                        url = _a.sent();
                        if (isActive) {
                            setShareUrl(url);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        loadShareUrl();
        return function () {
            isActive = false;
        };
    }, [deal.id, isOpen]);
    // Create share text
    var shareText = "\uD83C\uDF7D\uFE0F Amazing deal at ".concat(((_b = deal.restaurant) === null || _b === void 0 ? void 0 : _b.name) || 'this restaurant', "!\n\n").concat(deal.title, "\n").concat(deal.discountValue, "% OFF (Min order: $").concat(deal.minOrderAmount || '15', ")\n\nCheck it out on MealScout:");
    var handleCopyLink = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(shareUrl)];
                case 1:
                    _a.sent();
                    setCopied(true);
                    toast({
                        title: "Link Copied!",
                        description: "Special link has been copied to your clipboard.",
                    });
                    setTimeout(function () { return setCopied(false); }, 2000);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    toast({
                        title: "Copy Failed",
                        description: "Unable to copy link. Please try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleFacebookShare = function () {
        var facebookUrl = "https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(shareUrl), "&quote=").concat(encodeURIComponent(shareText));
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    };
    var handleTwitterShare = function () {
        var twitterText = "".concat(shareText, " ").concat(shareUrl);
        var twitterUrl = "https://twitter.com/intent/tweet?text=".concat(encodeURIComponent(twitterText));
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    };
    var handleWhatsAppShare = function () {
        var whatsappText = "".concat(shareText, " ").concat(shareUrl);
        var whatsappUrl = "https://wa.me/?text=".concat(encodeURIComponent(whatsappText));
        window.open(whatsappUrl, '_blank');
    };
    var handleEmailShare = function () {
        var _a;
        var subject = "Great Special at ".concat(((_a = deal.restaurant) === null || _a === void 0 ? void 0 : _a.name) || "a local restaurant", "!");
        var body = "".concat(shareText, "\n\n").concat(shareUrl);
        var emailUrl = "mailto:?subject=".concat(encodeURIComponent(subject), "&body=").concat(encodeURIComponent(body));
        window.open(emailUrl);
    };
    var shareOptions = [
        {
            name: "Facebook",
            icon: Facebook,
            color: "bg-blue-600 hover:bg-blue-700",
            onClick: handleFacebookShare,
            testId: "button-share-facebook"
        },
        {
            name: "Twitter",
            icon: Twitter,
            color: "bg-sky-500 hover:bg-sky-600",
            onClick: handleTwitterShare,
            testId: "button-share-twitter"
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-green-600 hover:bg-green-700",
            onClick: handleWhatsAppShare,
            testId: "button-share-whatsapp"
        },
        {
            name: "Email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            onClick: handleEmailShare,
            testId: "button-share-email"
        },
    ];
    return (<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5"/>
            <span>Share Special</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deal Preview */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-foreground text-sm mb-1">
              {deal.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {((_c = deal.restaurant) === null || _c === void 0 ? void 0 : _c.name) || 'Restaurant'} • {((_d = deal.restaurant) === null || _d === void 0 ? void 0 : _d.cuisineType) || 'Food'}
            </p>
            <div className="flex items-center space-x-2">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold">
                {deal.discountValue}% OFF
              </span>
              <span className="text-xs text-muted-foreground">
                Min: ${deal.minOrderAmount || '15'}
              </span>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Share Link
            </label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="flex-1 text-sm" data-testid="input-share-url"/>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="px-3" data-testid="button-copy-link">
                {copied ? (<Check className="w-4 h-4 text-green-600"/>) : (<Copy className="w-4 h-4"/>)}
              </Button>
            </div>
          </div>

          {/* Social Share Options */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Share On
            </label>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map(function (option) { return (<Button key={option.name} variant="outline" className={"".concat(option.color, " text-white border-0 flex items-center justify-center space-x-2 py-3")} onClick={option.onClick} data-testid={option.testId}>
                  <option.icon className="w-4 h-4"/>
                  <span className="text-sm">{option.name}</span>
                </Button>); })}
            </div>
          </div>

          {/* Share Stats (Future Enhancement) */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Help others discover great deals in your area!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}

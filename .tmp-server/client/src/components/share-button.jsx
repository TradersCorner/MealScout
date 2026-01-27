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
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateShareUrl } from '@/lib/share';
export default function ShareButton(_a) {
    var _this = this;
    var url = _a.url, title = _a.title, description = _a.description, _b = _a.variant, variant = _b === void 0 ? 'ghost' : _b, _c = _a.size, size = _c === void 0 ? 'sm' : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var toast = useToast().toast;
    var getShareUrl = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, getAffiliateShareUrl(url)];
    }); }); };
    var handleCopyLink = function () { return __awaiter(_this, void 0, void 0, function () {
        var shareUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getShareUrl()];
                case 1:
                    shareUrl = _a.sent();
                    return [4 /*yield*/, navigator.clipboard.writeText(shareUrl)];
                case 2:
                    _a.sent();
                    toast({
                        title: 'Link copied!',
                        description: 'Share link copied to clipboard',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Failed to copy',
                        description: 'Could not copy link to clipboard',
                        variant: 'destructive',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleShareFacebook = function () {
        getShareUrl().then(function (shareUrl) {
            var fbUrl = "https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(shareUrl));
            window.open(fbUrl, '_blank', 'width=600,height=400');
        });
    };
    var handleShareTwitter = function () {
        var text = description || title;
        getShareUrl().then(function (shareUrl) {
            var twitterUrl = "https://twitter.com/intent/tweet?url=".concat(encodeURIComponent(shareUrl), "&text=").concat(encodeURIComponent(text));
            window.open(twitterUrl, '_blank', 'width=600,height=400');
        });
    };
    var handleShareWhatsApp = function () {
        getShareUrl().then(function (shareUrl) {
            var text = "".concat(title, "\n").concat(shareUrl);
            var whatsappUrl = "https://wa.me/?text=".concat(encodeURIComponent(text));
            window.open(whatsappUrl, '_blank');
        });
    };
    var handleShareEmail = function () {
        getShareUrl().then(function (shareUrl) {
            var subject = encodeURIComponent(title);
            var body = encodeURIComponent("Check this out:\n\n".concat(title, "\n").concat(description || '', "\n\n").concat(shareUrl));
            window.location.href = "mailto:?subject=".concat(subject, "&body=").concat(body);
        });
    };
    var handleNativeShare = function () { return __awaiter(_this, void 0, void 0, function () {
        var shareUrl, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!navigator.share) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, getShareUrl()];
                case 2:
                    shareUrl = _a.sent();
                    return [4 /*yield*/, navigator.share({
                            title: title,
                            text: description || title,
                            url: shareUrl,
                        })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    // User cancelled or share failed
                    console.log('Share cancelled or failed');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Check if native share is available
    var hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4"/>
          {size !== 'icon' && <span className="ml-2">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasNativeShare && (<DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4"/>
            Share...
          </DropdownMenuItem>)}
        <DropdownMenuItem onClick={handleCopyLink}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareFacebook}>
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter}>
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareWhatsApp}>
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareEmail}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}

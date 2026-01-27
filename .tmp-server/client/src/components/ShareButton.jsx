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
import { Share2, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateShareUrl } from '@/lib/share';
export function ShareButton(_a) {
    var _this = this;
    var title = _a.title, description = _a.description, url = _a.url, imageUrl = _a.imageUrl;
    var toast = useToast().toast;
    var getShareUrl = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, getAffiliateShareUrl(url)];
    }); }); };
    var shareToFacebook = function () {
        getShareUrl().then(function (shareUrl) {
            window.open("https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(shareUrl)), '_blank', 'width=600,height=400');
        });
    };
    var shareToTwitter = function () {
        getShareUrl().then(function (shareUrl) {
            window.open("https://twitter.com/intent/tweet?text=".concat(encodeURIComponent(title), "&url=").concat(encodeURIComponent(shareUrl)), '_blank', 'width=600,height=400');
        });
    };
    var shareToWhatsApp = function () {
        getShareUrl().then(function (shareUrl) {
            window.open("https://wa.me/?text=".concat(encodeURIComponent("".concat(title, " - ").concat(shareUrl))), '_blank');
        });
    };
    var copyLink = function () { return __awaiter(_this, void 0, void 0, function () {
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
                        description: 'Share link has been copied to clipboard',
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Failed to copy',
                        description: 'Please try again',
                        variant: 'destructive',
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var nativeShare = function () { return __awaiter(_this, void 0, void 0, function () {
        var shareUrl, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!navigator.share) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, getShareUrl()];
                case 2:
                    shareUrl = _a.sent();
                    return [4 /*yield*/, navigator.share({
                            title: title,
                            text: description,
                            url: shareUrl,
                        })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    // User cancelled or error occurred
                    console.error('Share failed:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [3 /*break*/, 7];
                case 6:
                    copyLink();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2"/>
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="h-4 w-4 mr-2"/>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="h-4 w-4 mr-2"/>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp}>
          <MessageCircle className="h-4 w-4 mr-2"/>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <Share2 className="h-4 w-4 mr-2"/>
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}

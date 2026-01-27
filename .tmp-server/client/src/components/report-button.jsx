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
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
var REPORT_REASONS = [
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'spam', label: 'Spam or Misleading' },
    { value: 'offensive', label: 'Offensive or Hateful' },
    { value: 'misleading', label: 'False Information' },
    { value: 'other', label: 'Other' },
];
export default function ReportButton(_a) {
    var _this = this;
    var storyId = _a.storyId, _b = _a.variant, variant = _b === void 0 ? 'ghost' : _b, _c = _a.size, size = _c === void 0 ? 'sm' : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var _e = useState(false), open = _e[0], setOpen = _e[1];
    var _f = useState(''), reason = _f[0], setReason = _f[1];
    var _g = useState(''), description = _g[0], setDescription = _g[1];
    var toast = useToast().toast;
    var reportMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/stories/".concat(storyId, "/report"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ reason: reason, description: description }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        error = _a.sent();
                        throw new Error(error.message || 'Failed to report video');
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            toast({
                title: data.autoTakedown ? 'Video Removed' : 'Report Submitted',
                description: data.message,
            });
            setOpen(false);
            setReason('');
            setDescription('');
        },
        onError: function (error) {
            toast({
                title: 'Failed to Report',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    var handleSubmit = function () {
        if (!reason) {
            toast({
                title: 'Please select a reason',
                description: 'You must select a reason for reporting this video',
                variant: 'destructive',
            });
            return;
        }
        reportMutation.mutate();
    };
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-4 w-4"/>
          {size !== 'icon' && <span className="ml-2">Report</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Video</DialogTitle>
          <DialogDescription>
            Help us keep MealScout safe. If this video violates our community guidelines,
            please report it. Videos with 10+ reports are automatically removed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for Report
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason"/>
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map(function (r) { return (<SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>); })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Additional Details (Optional)
            </label>
            <Textarea id="description" placeholder="Provide more context about why you're reporting this video..." value={description} onChange={function (e) { return setDescription(e.target.value); }} rows={4}/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={function () { return setOpen(false); }} disabled={reportMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={reportMutation.isPending || !reason}>
            {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}

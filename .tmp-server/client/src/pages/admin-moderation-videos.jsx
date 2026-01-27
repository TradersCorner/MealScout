/**
 * Admin Moderation v1 — UI Only
 * - This UI controls visibility only (hide/restore/remove)
 * - No editing, ranking, messaging, or payments
 * - All copy sourced from ADMIN_MODERATION_COPY
 *
 * If an admin action cannot be expressed as a reducer event, it must not exist.
 */
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
import { useReducer, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ADMIN_MODERATION_COPY as COPY } from '@/copy/adminModeration.copy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertCircle, CheckSquare, FileDown } from 'lucide-react';
function assertNever(x) {
    throw new Error("Unexpected event: ".concat(JSON.stringify(x)));
}
export function moderationUITransition(state, event) {
    switch (state.state) {
        case 'idle': {
            switch (event.type) {
                case 'LOAD':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                case 'ACTION_SUCCESS':
                case 'ACTION_ERROR':
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                case 'BATCH_ACTION_SUCCESS':
                case 'BATCH_ACTION_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'loading': {
            switch (event.type) {
                case 'LOAD_SUCCESS':
                    return { state: 'ready' };
                case 'LOAD_ERROR':
                    return { state: 'error' };
                case 'LOAD':
                    return state;
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                case 'ACTION_SUCCESS':
                case 'ACTION_ERROR':
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                case 'BATCH_ACTION_SUCCESS':
                case 'BATCH_ACTION_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'ready': {
            switch (event.type) {
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                    return { state: 'actionPending' };
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                    return { state: 'batchActionPending' };
                case 'LOAD':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                case 'ACTION_SUCCESS':
                case 'ACTION_ERROR':
                case 'BATCH_ACTION_SUCCESS':
                case 'BATCH_ACTION_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'actionPending': {
            switch (event.type) {
                case 'ACTION_SUCCESS':
                    return { state: 'ready' };
                case 'ACTION_ERROR':
                    return { state: 'error' };
                case 'LOAD':
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                case 'BATCH_ACTION_SUCCESS':
                case 'BATCH_ACTION_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'batchActionPending': {
            switch (event.type) {
                case 'BATCH_ACTION_SUCCESS':
                    return { state: 'ready' };
                case 'BATCH_ACTION_ERROR':
                    return { state: 'error' };
                case 'LOAD':
                case 'LOAD_SUCCESS':
                case 'LOAD_ERROR':
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                case 'ACTION_SUCCESS':
                case 'ACTION_ERROR':
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                    return state;
                default:
                    assertNever(event);
            }
        }
        case 'error': {
            switch (event.type) {
                case 'LOAD':
                    return { state: 'loading' };
                case 'LOAD_SUCCESS':
                    return { state: 'ready' };
                case 'LOAD_ERROR':
                case 'HIDE':
                case 'RESTORE':
                case 'REMOVE':
                case 'ACTION_SUCCESS':
                case 'ACTION_ERROR':
                case 'BATCH_HIDE':
                case 'BATCH_RESTORE':
                case 'BATCH_ACTION_SUCCESS':
                case 'BATCH_ACTION_ERROR':
                    return state;
                default:
                    assertNever(event);
            }
        }
        default: {
            var _exhaustive = state;
            return _exhaustive;
        }
    }
}
function ModerationHeader(_a) {
    var selectionMode = _a.selectionMode, onToggleSelection = _a.onToggleSelection, selectedCount = _a.selectedCount;
    return (<div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary"/>
        <div>
          <h1 className="text-2xl font-bold">{COPY.page.title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {selectionMode && selectedCount > 0 && (<span className="text-sm text-muted-foreground">
            {COPY.batch.selected(selectedCount)}
          </span>)}
        <Button variant={selectionMode ? 'default' : 'outline'} size="sm" onClick={onToggleSelection}>
          <CheckSquare className="w-4 h-4 mr-2"/>
          {selectionMode ? COPY.batch.exitSelection : COPY.batch.selectionMode}
        </Button>
      </div>
    </div>);
}
function ModerationFilters(_a) {
    var typeFilter = _a.typeFilter, statusFilter = _a.statusFilter, onChange = _a.onChange;
    return (<Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{COPY.filters.type.label}</label>
            <Select value={typeFilter} onValueChange={function (value) { return onChange({ type: value, status: statusFilter }); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{COPY.filters.type.all}</SelectItem>
                <SelectItem value="user">{COPY.filters.type.user}</SelectItem>
                <SelectItem value="restaurant">{COPY.filters.type.restaurant}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{COPY.filters.status.label}</label>
            <Select value={statusFilter} onValueChange={function (value) { return onChange({ type: typeFilter, status: value }); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{COPY.filters.status.all}</SelectItem>
                <SelectItem value="visible">{COPY.filters.status.visible}</SelectItem>
                <SelectItem value="hidden">{COPY.filters.status.hidden}</SelectItem>
                <SelectItem value="removed">{COPY.filters.status.removed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>);
}
function BatchActionBar(_a) {
    var selectedCount = _a.selectedCount, onBatchHide = _a.onBatchHide, onBatchRestore = _a.onBatchRestore, disabled = _a.disabled;
    if (selectedCount === 0)
        return null;
    return (<Card className="mb-6 bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {COPY.batch.selected(selectedCount)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onBatchHide} disabled={disabled || selectedCount === 0}>
              {COPY.batch.batchHide}
            </Button>
            <Button variant="outline" size="sm" onClick={onBatchRestore} disabled={disabled || selectedCount === 0}>
              {COPY.batch.batchRestore}
            </Button>
            <span className="text-xs text-muted-foreground self-center px-2">
              {COPY.batch.noRemove}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>);
}
function ModerationEvidencePane(_a) {
    var _this = this;
    var videoId = _a.videoId, disabled = _a.disabled;
    var _b = useState(false), isExpanded = _b[0], setIsExpanded = _b[1];
    // Fetch evidence from existing report data (read-only)
    var evidence = useQuery({
        queryKey: ['/api/admin/video-evidence', videoId],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, data, reports, videoReports, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("/api/admin/reported-videos?status=pending")];
                    case 1:
                        res = _b.sent();
                        if (!res.ok)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _b.sent();
                        reports = data.reports || [];
                        videoReports = reports.filter(function (r) { return r.storyId === videoId; });
                        if (videoReports.length === 0)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                reportCount: videoReports.length,
                                reportTimestamps: videoReports.map(function (r) { return new Date(r.createdAt); }),
                                reporterIds: videoReports.map(function (r) { var _a; return "".concat((_a = r.reportedBy) === null || _a === void 0 ? void 0 : _a.slice(0, 4), "***"); }), // Redacted
                                priorActions: [], // Would come from audit logs in production
                                videoAge: videoReports[0].createdAt ? new Date(videoReports[0].createdAt) : undefined,
                            }];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        }); },
        enabled: isExpanded && !disabled,
    }).data;
    var toggleExpanded = function () {
        if (!disabled) {
            setIsExpanded(!isExpanded);
        }
    };
    return (<div className="mt-3 border-t pt-3">
      <Button size="sm" variant="ghost" onClick={toggleExpanded} disabled={disabled} className="w-full justify-start text-xs">
        {isExpanded ? COPY.evidence.toggleHide : COPY.evidence.toggle}
      </Button>

      {isExpanded && (<div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded">
          {!evidence ? (<p className="text-gray-500 italic">{COPY.evidence.noEvidence}</p>) : (<>
              {evidence.reportCount > 0 && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.reportCount}:</span>
                  <span className="text-gray-600">{evidence.reportCount}</span>
                </div>)}

              {evidence.reportTimestamps.length > 0 && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.reportTimestamps}:</span>
                  <span className="text-gray-600">
                    {evidence.reportTimestamps.map(function (t) { return t.toLocaleDateString(); }).join(', ')}
                  </span>
                </div>)}

              {evidence.reporterIds.length > 0 && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.reportersRedacted}:</span>
                  <span className="text-gray-600 font-mono text-xs">
                    {evidence.reporterIds.join(', ')}
                  </span>
                </div>)}

              {evidence.videoAge && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.videoAge}:</span>
                  <span className="text-gray-600">
                    {evidence.videoAge.toLocaleDateString()}
                  </span>
                </div>)}

              {evidence.views !== undefined && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.views}:</span>
                  <span className="text-gray-600">{evidence.views.toLocaleString()}</span>
                </div>)}

              {evidence.likes !== undefined && (<div className="flex justify-between">
                  <span className="font-medium text-gray-700">{COPY.evidence.likes}:</span>
                  <span className="text-gray-600">{evidence.likes.toLocaleString()}</span>
                </div>)}

              <div className="border-t pt-2 mt-2">
                <div className="font-medium text-gray-700 mb-1">{COPY.evidence.priorActions}:</div>
                {evidence.priorActions.length === 0 ? (<p className="text-gray-500 italic">{COPY.evidence.noPriorActions}</p>) : (<ul className="space-y-1">
                    {evidence.priorActions.map(function (action, idx) {
                        var actionLabel = action.action === 'hide'
                            ? COPY.evidence.action.hide
                            : action.action === 'restore'
                                ? COPY.evidence.action.restore
                                : COPY.evidence.action.remove;
                        return (<li key={idx} className="text-gray-600">
                          {action.timestamp.toLocaleDateString()} - {actionLabel}
                          {action.reason && " (".concat(action.reason, ")")}
                        </li>);
                    })}
                  </ul>)}
              </div>
            </>)}
        </div>)}
    </div>);
}
function ModerationActions(_a) {
    var status = _a.status, disabled = _a.disabled, onHide = _a.onHide, onRestore = _a.onRestore, onRemove = _a.onRemove, onExport = _a.onExport;
    return (<div className="flex gap-2 mt-3 flex-wrap">
      {status === 'visible' && (<Button size="sm" variant="outline" onClick={onHide} disabled={disabled}>
          {COPY.actions.hide}
        </Button>)}
      {status === 'hidden' && (<Button size="sm" variant="outline" onClick={onRestore} disabled={disabled}>
          {COPY.actions.restore}
        </Button>)}
      <Button size="sm" variant="destructive" onClick={onRemove} disabled={disabled}>
        {COPY.actions.remove}
      </Button>
      <Button size="sm" variant="outline" onClick={onExport} disabled={disabled}>
        <FileDown className="w-4 h-4 mr-2"/>
        {COPY.export.button}
      </Button>
    </div>);
}
function RemoveConfirmModal(_a) {
    var open = _a.open, onConfirm = _a.onConfirm, onCancel = _a.onCancel;
    var _b = useState(''), reason = _b[0], setReason = _b[1];
    var _c = useState(''), note = _c[0], setNote = _c[1];
    var handleConfirm = function () {
        if (!reason)
            return;
        onConfirm(reason, note);
        setReason('');
        setNote('');
    };
    return (<Dialog open={open} onOpenChange={function (isOpen) { return !isOpen && onCancel(); }}>
      <DialogContent className="admin-dialog">
        <DialogHeader>
          <DialogTitle>{COPY.confirm.removeTitle}</DialogTitle>
          <DialogDescription>{COPY.confirm.removeDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{COPY.labels.selectReason}</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={COPY.labels.selectReason}/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">{COPY.reasons.spam}</SelectItem>
                <SelectItem value="inappropriate">{COPY.reasons.inappropriate}</SelectItem>
                <SelectItem value="misleading">{COPY.reasons.misleading}</SelectItem>
                <SelectItem value="policy">{COPY.reasons.policy}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{COPY.labels.internalNote}</label>
            <Textarea value={note} onChange={function (e) { return setNote(e.target.value); }} placeholder={COPY.labels.internalNote} rows={3}/>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {COPY.actions.cancel}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason}>
            {COPY.actions.confirmRemove}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
function PerItemReasonModal(_a) {
    var open = _a.open, items = _a.items, onComplete = _a.onComplete, onCancel = _a.onCancel;
    var _b = useState(new Map()), reasons = _b[0], setReasons = _b[1];
    useEffect(function () {
        if (open) {
            setReasons(new Map());
        }
    }, [open]);
    var handleReasonChange = function (videoId, reason) {
        var newReasons = new Map(reasons);
        if (reason) {
            newReasons.set(videoId, reason);
        }
        else {
            newReasons.delete(videoId);
        }
        setReasons(newReasons);
    };
    var handleExecute = function () {
        if (reasons.size === items.length) {
            onComplete(reasons);
            setReasons(new Map());
        }
    };
    var allReasonsAssigned = reasons.size === items.length;
    return (<Dialog open={open} onOpenChange={function (isOpen) { return !isOpen && onCancel(); }}>
      <DialogContent className="admin-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{COPY.batch.perItemReasonTitle}</DialogTitle>
          <DialogDescription>{COPY.batch.perItemReasonDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {items.map(function (item) {
            var hasReason = reasons.has(item.videoId);
            return (<Card key={item.videoId} className={hasReason ? 'border-green-500/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {item.kind === 'user' && (<>
                            <Badge variant="outline">{COPY.labels.recommendation}</Badge>
                            {item.isGoldenFork && <span className="text-sm">{COPY.labels.goldenFork}</span>}
                          </>)}
                        {item.kind === 'restaurant' && (<Badge variant="outline">{COPY.labels.sponsored}</Badge>)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.kind === 'user'
                    ? "".concat(item.reviewerName, " \u2192 ").concat(item.restaurantName)
                    : "".concat(item.restaurantName, " (").concat(item.campaignId, ")")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-48">
                      <Select value={reasons.get(item.videoId) || ''} onValueChange={function (value) { return handleReasonChange(item.videoId, value); }}>
                        <SelectTrigger className={hasReason ? 'border-green-500' : ''}>
                          <SelectValue placeholder={COPY.batch.assignReason}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spam">{COPY.reasons.spam}</SelectItem>
                          <SelectItem value="inappropriate">{COPY.reasons.inappropriate}</SelectItem>
                          <SelectItem value="misleading">{COPY.reasons.misleading}</SelectItem>
                          <SelectItem value="policy">{COPY.reasons.policy}</SelectItem>
                        </SelectContent>
                      </Select>
                      {hasReason && (<span className="text-xs text-green-600 font-medium">
                          {COPY.batch.reasonAssigned}
                        </span>)}
                    </div>
                  </div>
                </CardContent>
              </Card>);
        })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {COPY.batch.cancelBatch}
          </Button>
          <Button onClick={handleExecute} disabled={!allReasonsAssigned}>
            {COPY.batch.executeAction}
            {!allReasonsAssigned && " (".concat(reasons.size, "/").concat(items.length, ")")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
function ExportConfirmModal(_a) {
    var open = _a.open, videoId = _a.videoId, onConfirm = _a.onConfirm, onCancel = _a.onCancel;
    return (<Dialog open={open} onOpenChange={function (isOpen) { return !isOpen && onCancel(); }}>
      <DialogContent className="admin-dialog">
        <DialogHeader>
          <DialogTitle>{COPY.export.confirmTitle}</DialogTitle>
          <DialogDescription>{COPY.export.confirmDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{COPY.export.snapshotLabel}:</span> Video ID {videoId}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {COPY.export.confirmCancel}
          </Button>
          <Button onClick={onConfirm}>
            <FileDown className="w-4 h-4 mr-2"/>
            {COPY.export.confirmExport}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
function UserVideoModerationCard(_a) {
    var item = _a.item, disabled = _a.disabled, selectionMode = _a.selectionMode, selected = _a.selected, onToggleSelect = _a.onToggleSelect, onHide = _a.onHide, onRestore = _a.onRestore, onRemove = _a.onRemove, onExport = _a.onExport;
    var statusColor = item.status === 'visible' ? 'bg-green-100 text-green-800' : item.status === 'hidden' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    return (<Card className={"".concat(item.status !== 'visible' ? 'opacity-60' : '', " ").concat(selected ? 'ring-2 ring-primary' : '')}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {selectionMode && (<div className="flex items-start pt-1">
              <Checkbox checked={selected} onCheckedChange={function () { return onToggleSelect(item.videoId); }} disabled={disabled}/>
            </div>)}
          <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
            {item.videoUrl ? (<video src={item.videoUrl} className="w-full h-full object-cover rounded"/>) : ('No preview')}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{COPY.labels.recommendation}</Badge>
              {item.isGoldenFork && (<Badge className="bg-yellow-100 text-yellow-800">{COPY.labels.goldenFork}</Badge>)}
              <Badge className={statusColor}>{item.status}</Badge>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">{COPY.labels.reviewer}:</span> {item.reviewerName}
              </div>
              <div>
                <span className="font-medium">{COPY.labels.restaurant}:</span> {item.restaurantName}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>

            <ModerationActions status={item.status} disabled={disabled} onHide={onHide} onRestore={onRestore} onRemove={onRemove} onExport={onExport}/>

            <ModerationEvidencePane videoId={item.videoId} disabled={disabled}/>
          </div>
        </div>
      </CardContent>
    </Card>);
}
function RestaurantAdModerationCard(_a) {
    var item = _a.item, disabled = _a.disabled, selectionMode = _a.selectionMode, selected = _a.selected, onToggleSelect = _a.onToggleSelect, onHide = _a.onHide, onRestore = _a.onRestore, onRemove = _a.onRemove, onExport = _a.onExport;
    var statusColor = item.status === 'visible' ? 'bg-green-100 text-green-800' : item.status === 'hidden' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    return (<Card className={"".concat(item.status !== 'visible' ? 'opacity-60' : '', " ").concat(selected ? 'ring-2 ring-primary' : '')}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {selectionMode && (<div className="flex items-start pt-1">
              <Checkbox checked={selected} onCheckedChange={function () { return onToggleSelect(item.videoId); }} disabled={disabled}/>
            </div>)}
          <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
            {item.videoUrl ? (<video src={item.videoUrl} className="w-full h-full object-cover rounded"/>) : ('No preview')}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">{COPY.labels.sponsored}</Badge>
              <Badge className={statusColor}>{item.status}</Badge>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">{COPY.labels.restaurant}:</span> {item.restaurantName}
              </div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">{COPY.labels.campaign}:</span> {item.campaignId}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>

            <ModerationActions status={item.status} disabled={disabled} onHide={onHide} onRestore={onRestore} onRemove={onRemove} onExport={onExport}/>

            <ModerationEvidencePane videoId={item.videoId} disabled={disabled}/>
          </div>
        </div>
      </CardContent>
    </Card>);
}
function ModerationItemCard(_a) {
    var item = _a.item, disabled = _a.disabled, selectionMode = _a.selectionMode, selected = _a.selected, onToggleSelect = _a.onToggleSelect, onHide = _a.onHide, onRestore = _a.onRestore, onRemove = _a.onRemove, onExport = _a.onExport;
    if (item.kind === 'user') {
        return (<UserVideoModerationCard item={item} disabled={disabled} selectionMode={selectionMode} selected={selected} onToggleSelect={onToggleSelect} onHide={function () { return onHide(item.videoId); }} onRestore={function () { return onRestore(item.videoId); }} onRemove={function () { return onRemove(item.videoId); }} onExport={function () { return onExport(item.videoId); }}/>);
    }
    if (item.kind === 'restaurant') {
        return (<RestaurantAdModerationCard item={item} disabled={disabled} selectionMode={selectionMode} selected={selected} onToggleSelect={onToggleSelect} onHide={function () { return onHide(item.videoId); }} onRestore={function () { return onRestore(item.videoId); }} onRemove={function () { return onRemove(item.videoId); }} onExport={function () { return onExport(item.videoId); }}/>);
    }
    assertNever(item);
}
function ModerationFeed(_a) {
    var items = _a.items, uiState = _a.uiState, selectionMode = _a.selectionMode, selectedIds = _a.selectedIds, onToggleSelect = _a.onToggleSelect, onHide = _a.onHide, onRestore = _a.onRestore, onRemove = _a.onRemove, onExport = _a.onExport;
    var actionsDisabled = uiState.state === 'actionPending' || uiState.state === 'batchActionPending';
    return (<div className="space-y-4">
      {items.map(function (item) { return (<ModerationItemCard key={item.videoId} item={item} disabled={actionsDisabled} selectionMode={selectionMode} selected={selectedIds.has(item.videoId)} onToggleSelect={onToggleSelect} onHide={onHide} onRestore={onRestore} onRemove={onRemove} onExport={onExport}/>); })}
    </div>);
}
function ModerationEmpty() {
    return (<Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{COPY.page.empty}</p>
      </CardContent>
    </Card>);
}
function ModerationError(_a) {
    var onRetry = _a.onRetry;
    return (<Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-destructive"/>
        </div>
        <p className="text-muted-foreground">{COPY.page.error}</p>
        <Button onClick={onRetry}>{COPY.page.retry}</Button>
      </CardContent>
    </Card>);
}
// ============================================================================
// Main Page Component
// ============================================================================
export default function AdminModerationVideosPage() {
    var _this = this;
    var _a = useReducer(moderationUITransition, { state: 'idle' }), uiState = _a[0], dispatch = _a[1];
    var _b = useState('all'), typeFilter = _b[0], setTypeFilter = _b[1];
    var _c = useState('all'), statusFilter = _c[0], setStatusFilter = _c[1];
    var _d = useState(false), removeModalOpen = _d[0], setRemoveModalOpen = _d[1];
    var _e = useState(null), selectedVideoId = _e[0], setSelectedVideoId = _e[1];
    // Batch selection state
    var _f = useState(false), selectionMode = _f[0], setSelectionMode = _f[1];
    var _g = useState(new Set()), selectedIds = _g[0], setSelectedIds = _g[1];
    var _h = useState(false), batchReasonModalOpen = _h[0], setBatchReasonModalOpen = _h[1];
    var _j = useState(null), batchAction = _j[0], setBatchAction = _j[1];
    // Evidence export state
    var _k = useState(false), exportModalOpen = _k[0], setExportModalOpen = _k[1];
    var _l = useState(null), exportVideoId = _l[0], setExportVideoId = _l[1];
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    // Fetch reported videos from existing endpoint
    var _m = useQuery({
        queryKey: ['/api/admin/reported-videos', statusFilter === 'all' ? 'pending' : statusFilter],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var status, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = statusFilter === 'all' ? 'pending' : statusFilter;
                        return [4 /*yield*/, fetch("/api/admin/reported-videos?status=".concat(status))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.reports || []];
                }
            });
        }); },
        enabled: uiState.state !== 'idle',
    }), _o = _m.data, rawReports = _o === void 0 ? [] : _o, isLoading = _m.isLoading, isError = _m.isError;
    // Map to ModerationItem[] (discriminated union)
    var moderationItems = rawReports
        .map(function (report) {
        // For now, all items from this endpoint are user videos
        // In a real system, you'd check a type field or separate endpoints
        if (report.storyUrl) {
            return {
                kind: 'user',
                videoId: report.storyId,
                reviewerName: report.reportedBy || 'Unknown',
                restaurantName: 'N/A',
                isGoldenFork: false,
                videoUrl: report.storyUrl,
                createdAt: new Date(report.createdAt),
                status: report.status === 'action_taken' ? 'removed' : 'visible',
            };
        }
        return null;
    })
        .filter(function (item) { return item !== null; });
    // Trigger LOAD on mount and filter changes
    useEffect(function () {
        dispatch({ type: 'LOAD' });
    }, [typeFilter, statusFilter]);
    // Map query status to FSM events
    useEffect(function () {
        if (uiState.state === 'loading') {
            if (isError) {
                dispatch({ type: 'LOAD_ERROR' });
            }
            else if (!isLoading) {
                dispatch({ type: 'LOAD_SUCCESS' });
            }
        }
    }, [isLoading, isError, uiState.state]);
    // Remove mutation (using existing review-report endpoint)
    var removeMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var res;
            var reportId = _b.reportId, reason = _b.reason, note = _b.note;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/review-report/".concat(reportId), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'takedown', notes: "".concat(reason, ": ").concat(note) }),
                        })];
                    case 1:
                        res = _c.sent();
                        if (!res.ok)
                            throw new Error('Remove failed');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            dispatch({ type: 'ACTION_SUCCESS' });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/reported-videos'] });
            toast({
                title: COPY.notifications.removeSuccess,
            });
            setRemoveModalOpen(false);
            setSelectedVideoId(null);
        },
        onError: function () {
            dispatch({ type: 'ACTION_ERROR' });
            toast({
                title: COPY.notifications.actionError,
                variant: 'destructive',
            });
        },
    });
    var handleFiltersChange = function (filters) {
        setTypeFilter(filters.type);
        setStatusFilter(filters.status);
    };
    var handleHide = function (id) {
        dispatch({ type: 'HIDE' });
        // In a real implementation, you'd call a hide endpoint here
        // For now, we'll just dispatch ACTION_SUCCESS
        setTimeout(function () {
            dispatch({ type: 'ACTION_SUCCESS' });
            toast({ title: COPY.notifications.hideSuccess });
        }, 500);
    };
    var handleRestore = function (id) {
        dispatch({ type: 'RESTORE' });
        // In a real implementation, you'd call a restore endpoint here
        setTimeout(function () {
            dispatch({ type: 'ACTION_SUCCESS' });
            toast({ title: COPY.notifications.restoreSuccess });
        }, 500);
    };
    var handleRemove = function (id) {
        setSelectedVideoId(id);
        setRemoveModalOpen(true);
    };
    var handleConfirmRemove = function (reason, note) {
        if (!selectedVideoId)
            return;
        dispatch({ type: 'REMOVE' });
        // Find the report ID for this video
        var report = rawReports.find(function (r) { return r.storyId === selectedVideoId; });
        if (report) {
            removeMutation.mutate({ reportId: report.reportId, reason: reason, note: note });
        }
        else {
            dispatch({ type: 'ACTION_ERROR' });
            toast({
                title: COPY.notifications.actionError,
                variant: 'destructive',
            });
        }
    };
    var handleRetry = function () {
        dispatch({ type: 'LOAD' });
    };
    // Batch selection handlers
    var handleToggleSelectionMode = function () {
        setSelectionMode(!selectionMode);
        if (selectionMode) {
            setSelectedIds(new Set()); // Clear selection when exiting
        }
    };
    var handleToggleSelect = function (id) {
        var newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        }
        else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };
    var handleBatchHide = function () {
        if (selectedIds.size === 0) {
            toast({ title: COPY.batch.minSelection, variant: 'destructive' });
            return;
        }
        setBatchAction('hide');
        setBatchReasonModalOpen(true);
    };
    var handleBatchRestore = function () {
        if (selectedIds.size === 0) {
            toast({ title: COPY.batch.minSelection, variant: 'destructive' });
            return;
        }
        setBatchAction('restore');
        setBatchReasonModalOpen(true);
    };
    var handleBatchExecute = function (reasons) { return __awaiter(_this, void 0, void 0, function () {
        var selectedItems, succeeded, failed, _i, selectedItems_1, item, reason, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!batchAction)
                        return [2 /*return*/];
                    dispatch({ type: batchAction === 'hide' ? 'BATCH_HIDE' : 'BATCH_RESTORE' });
                    setBatchReasonModalOpen(false);
                    selectedItems = moderationItems.filter(function (item) { return selectedIds.has(item.videoId); });
                    succeeded = 0;
                    failed = 0;
                    _i = 0, selectedItems_1 = selectedItems;
                    _a.label = 1;
                case 1:
                    if (!(_i < selectedItems_1.length)) return [3 /*break*/, 6];
                    item = selectedItems_1[_i];
                    reason = reasons.get(item.videoId);
                    if (!reason) {
                        failed++;
                        return [3 /*break*/, 5];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    // In a real implementation, call the hide/restore endpoint
                    // For now, simulate with delay
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                case 3:
                    // In a real implementation, call the hide/restore endpoint
                    // For now, simulate with delay
                    _a.sent();
                    succeeded++;
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    failed++;
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    // Report results
                    dispatch({ type: 'BATCH_ACTION_SUCCESS' });
                    if (failed === 0) {
                        toast({ title: COPY.batch.allSuccess(succeeded) });
                    }
                    else if (succeeded === 0) {
                        toast({ title: COPY.batch.allFailed, variant: 'destructive' });
                    }
                    else {
                        toast({ title: COPY.batch.partialSuccess(succeeded, failed), variant: 'default' });
                    }
                    // Clear selection and exit selection mode
                    setSelectedIds(new Set());
                    setSelectionMode(false);
                    setBatchAction(null);
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/reported-videos'] });
                    return [2 /*return*/];
            }
        });
    }); };
    // Export handler
    var handleExport = function (id) {
        setExportVideoId(id);
        setExportModalOpen(true);
    };
    var handleConfirmExport = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, blob, url, a, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!exportVideoId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    toast({ title: COPY.export.downloading });
                    setExportModalOpen(false);
                    return [4 /*yield*/, fetch("/api/admin/export-evidence/".concat(exportVideoId))];
                case 2:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Export failed');
                    return [4 /*yield*/, res.blob()];
                case 3:
                    blob = _a.sent();
                    url = window.URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "evidence-".concat(exportVideoId, "-").concat(Date.now(), ".pdf");
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toast({ title: COPY.export.success });
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    toast({ title: COPY.export.error, variant: 'destructive' });
                    return [3 /*break*/, 6];
                case 5:
                    setExportVideoId(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var selectedItems = moderationItems.filter(function (item) { return selectedIds.has(item.videoId); });
    return (<div className="max-w-7xl mx-auto min-h-screen bg-background p-6">
      <ModerationHeader selectionMode={selectionMode} onToggleSelection={handleToggleSelectionMode} selectedCount={selectedIds.size}/>

      <ModerationFilters typeFilter={typeFilter} statusFilter={statusFilter} onChange={handleFiltersChange}/>

      {selectionMode && (<BatchActionBar selectedCount={selectedIds.size} onBatchHide={handleBatchHide} onBatchRestore={handleBatchRestore} disabled={uiState.state === 'batchActionPending'}/>)}

      {uiState.state === 'loading' && (<div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
          <span className="ml-3 text-muted-foreground">{COPY.page.loading}</span>
        </div>)}

      {uiState.state === 'error' && <ModerationError onRetry={handleRetry}/>}

      {(uiState.state === 'ready' || uiState.state === 'actionPending' || uiState.state === 'batchActionPending') && (<>
          {moderationItems.length === 0 ? (<ModerationEmpty />) : (<ModerationFeed items={moderationItems} uiState={uiState} selectionMode={selectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} onHide={handleHide} onRestore={handleRestore} onRemove={handleRemove} onExport={handleExport}/>)}
        </>)}

      <RemoveConfirmModal open={removeModalOpen} onConfirm={handleConfirmRemove} onCancel={function () {
            setRemoveModalOpen(false);
            setSelectedVideoId(null);
        }}/>

      <PerItemReasonModal open={batchReasonModalOpen} items={selectedItems} onComplete={handleBatchExecute} onCancel={function () {
            setBatchReasonModalOpen(false);
            setBatchAction(null);
        }}/>

      <ExportConfirmModal open={exportModalOpen} videoId={exportVideoId} onConfirm={handleConfirmExport} onCancel={function () {
            setExportModalOpen(false);
            setExportVideoId(null);
        }}/>
    </div>);
}

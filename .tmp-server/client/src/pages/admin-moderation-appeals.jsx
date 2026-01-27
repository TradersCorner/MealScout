/**
 * Appeal Intake v1 — Read-Only Appeals Registry
 *
 * CRITICAL GUARDRAIL:
 * Appeals do not alter moderation outcomes.
 * This is a compliance and transparency surface only.
 *
 * NO FSM (static list + detail drawer).
 * NO mutations (read-only queries only).
 * NO messaging or aggregation.
 *
 * All copy sourced from APPEAL_INTAKE_COPY.
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
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APPEAL_INTAKE_COPY as COPY } from '@/copy/appealIntake.copy';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { AlertCircle, FileText } from 'lucide-react';
// ============================================================================
// Components
// ============================================================================
function AppealsHeader() {
    return (<div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-primary"/>
        <h1 className="text-2xl font-bold">{COPY.page.title}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{COPY.page.subtitle}</p>
    </div>);
}
function StatusFilter(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<div className="flex items-center gap-3 mb-6">
      <label className="text-sm font-medium">{COPY.filters.status.label}</label>
      <Select value={value} onValueChange={function (v) { return onChange(v); }}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{COPY.filters.status.all}</SelectItem>
          <SelectItem value="received">{COPY.filters.status.received}</SelectItem>
          <SelectItem value="reviewed">{COPY.filters.status.reviewed}</SelectItem>
        </SelectContent>
      </Select>
    </div>);
}
function AppealDetailDrawer(_a) {
    var appeal = _a.appeal, onClose = _a.onClose;
    if (!appeal)
        return null;
    var statusColor = appeal.status === 'received'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800';
    var actionLabel = appeal.referencedDecision.action === 'hide'
        ? COPY.actions.hide
        : appeal.referencedDecision.action === 'restore'
            ? COPY.actions.restore
            : COPY.actions.remove;
    return (<Sheet open={!!appeal} onOpenChange={function (open) { return !open && onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{COPY.detail.title}</SheetTitle>
          <SheetDescription>{COPY.detail.disclaimer}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Appeal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appeal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.id}:</span>
                <span className="text-sm font-mono">{appeal.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.submittedAt}:</span>
                <span className="text-sm">{appeal.submittedAt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.status}:</span>
                <Badge className={statusColor}>
                  {appeal.status === 'received' ? COPY.status.received : COPY.status.reviewed}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.appeal.party}:</span>
                <span className="text-sm font-mono">{appeal.appealingPartyId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Referenced Decision */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{COPY.detail.decision.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.decisionId}:</span>
                <span className="text-sm font-mono">{appeal.referencedDecision.decisionId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.date}:</span>
                <span className="text-sm">{appeal.referencedDecision.date.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.action}:</span>
                <span className="text-sm font-semibold">{actionLabel}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">{COPY.detail.decision.reason}:</span>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {appeal.referencedDecision.reason || COPY.detail.decision.noReason}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attached Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{COPY.detail.evidence.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {appeal.evidenceLinks.length === 0 ? (<p className="text-sm text-muted-foreground italic">{COPY.detail.evidence.noEvidence}</p>) : (<ul className="space-y-2">
                  {appeal.evidenceLinks.map(function (link, idx) { return (<li key={idx} className="text-sm">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {COPY.detail.evidence.link} {idx + 1}
                      </a>
                    </li>); })}
                </ul>)}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="w-full">
            {COPY.detail.close}
          </Button>
        </div>
      </SheetContent>
    </Sheet>);
}
function AppealsList(_a) {
    var appeals = _a.appeals, onViewDetails = _a.onViewDetails;
    return (<Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{COPY.list.appealId}</TableHead>
              <TableHead>{COPY.list.submittedAt}</TableHead>
              <TableHead>{COPY.list.status}</TableHead>
              <TableHead>{COPY.list.decisionDate}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map(function (appeal) {
            var statusColor = appeal.status === 'received'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800';
            return (<TableRow key={appeal.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{appeal.id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-sm">{appeal.submittedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColor}>
                      {appeal.status === 'received' ? COPY.status.received : COPY.status.reviewed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {appeal.referencedDecision.date.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={function () { return onViewDetails(appeal); }}>
                      {COPY.list.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>);
        })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>);
}
function AppealsEmpty() {
    return (<Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{COPY.page.empty}</p>
      </CardContent>
    </Card>);
}
function AppealsError(_a) {
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
export default function AdminModerationAppealsPage() {
    var _this = this;
    var _a = useState('all'), statusFilter = _a[0], setStatusFilter = _a[1];
    var _b = useState(null), selectedAppeal = _b[0], setSelectedAppeal = _b[1];
    // Fetch appeals (read-only, no mutations)
    var _c = useQuery({
        queryKey: ['/api/admin/moderation-appeals', statusFilter],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest('GET', "/api/admin/moderation-appeals?status=".concat(statusFilter))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        payload = _a.sent();
                        if (!Array.isArray(payload)) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, payload.map(function (appeal) {
                                var _a, _b, _c, _d;
                                return ({
                                    id: String(appeal.id || ''),
                                    submittedAt: appeal.submittedAt ? new Date(appeal.submittedAt) : new Date(),
                                    status: appeal.status === 'reviewed' ? 'reviewed' : 'received',
                                    appealingPartyId: String(appeal.appealingPartyId || ''),
                                    referencedDecision: {
                                        decisionId: String(((_a = appeal.referencedDecision) === null || _a === void 0 ? void 0 : _a.decisionId) || ''),
                                        date: ((_b = appeal.referencedDecision) === null || _b === void 0 ? void 0 : _b.date)
                                            ? new Date(appeal.referencedDecision.date)
                                            : appeal.submittedAt
                                                ? new Date(appeal.submittedAt)
                                                : new Date(),
                                        action: ['hide', 'restore', 'remove'].includes((_c = appeal.referencedDecision) === null || _c === void 0 ? void 0 : _c.action)
                                            ? appeal.referencedDecision.action
                                            : 'hide',
                                        reason: ((_d = appeal.referencedDecision) === null || _d === void 0 ? void 0 : _d.reason) || null,
                                    },
                                    evidenceLinks: Array.isArray(appeal.evidenceLinks)
                                        ? appeal.evidenceLinks
                                        : [],
                                });
                            })];
                }
            });
        }); },
    }), appeals = _c.data, isLoading = _c.isLoading, isError = _c.isError, refetch = _c.refetch;
    var filteredAppeals = appeals || [];
    var handleRetry = function () {
        refetch();
    };
    return (<div className="max-w-7xl mx-auto min-h-screen bg-[var(--bg-app)] p-6">
      <AppealsHeader />

      <StatusFilter value={statusFilter} onChange={setStatusFilter}/>

      {isLoading && (<div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
          <span className="ml-3 text-muted-foreground">{COPY.page.loading}</span>
        </div>)}

      {isError && <AppealsError onRetry={handleRetry}/>}

      {!isLoading && !isError && (<>
          {filteredAppeals.length === 0 ? (<AppealsEmpty />) : (<AppealsList appeals={filteredAppeals} onViewDetails={setSelectedAppeal}/>)}
        </>)}

      <AppealDetailDrawer appeal={selectedAppeal} onClose={function () { return setSelectedAppeal(null); }}/>
    </div>);
}

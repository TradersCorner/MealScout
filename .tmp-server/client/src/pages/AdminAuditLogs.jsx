var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
var ACTION_TYPES = [
    'login',
    'logout',
    'create',
    'update',
    'delete',
    'publish',
    'unpublish',
    'incident_created',
    'incident_acknowledged',
    'incident_resolved',
    'incident_closed',
];
var RESOURCE_TYPES = [
    'user',
    'restaurant',
    'menu',
    'deal',
    'incident',
    'auth',
];
export default function AdminAuditLogs() {
    var _this = this;
    var _a = useState(null), selectedLog = _a[0], setSelectedLog = _a[1];
    var _b = useState({
        action: '',
        resourceType: '',
        userId: '',
        search: '',
        days: '30',
    }), filters = _b[0], setFilters = _b[1];
    var _c = useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var params, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (filters.action)
                            params.append('action', filters.action);
                        if (filters.resourceType)
                            params.append('resourceType', filters.resourceType);
                        if (filters.userId)
                            params.append('userId', filters.userId);
                        if (filters.search)
                            params.append('search', filters.search);
                        params.append('days', filters.days);
                        return [4 /*yield*/, fetch("/api/admin/audit-logs?".concat(params))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch logs');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 60000,
    }), _d = _c.data, logs = _d === void 0 ? [] : _d, isLoading = _c.isLoading;
    var handleExport = function () {
        var csv = __spreadArray([
            ['ID', 'User', 'Action', 'Resource', 'IP', 'Timestamp']
        ], logs.map(function (log) { return [
            log.id,
            log.userId,
            log.action,
            "".concat(log.resourceType, ":").concat(log.resourceId),
            log.ip,
            new Date(log.createdAt).toISOString(),
        ]; }), true).map(function (row) { return row.map(function (cell) { return "\"".concat(cell, "\""); }).join(','); })
            .join('\n');
        var blob = new Blob([csv], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "audit-logs-".concat(new Date().toISOString().split('T')[0], ".csv");
        a.click();
    };
    var handleCopyMetadata = function (metadata) {
        navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    };
    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }
    return (<div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>{logs.length} events in last {filters.days} days</CardDescription>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2"/> Export CSV
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="space-y-4">
            {/* Row 1: Search and time range */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <Input placeholder="Search by ID, user, or resource..." value={filters.search} onChange={function (e) { return setFilters(__assign(__assign({}, filters), { search: e.target.value })); }} className="pl-10"/>
              </div>
              <Select value={filters.days} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { days: v })); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time range"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Action and resource type */}
            <div className="flex gap-4 flex-wrap">
              <Select value={filters.action} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { action: v })); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by action"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {ACTION_TYPES.map(function (action) { return (<SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>); })}
                </SelectContent>
              </Select>

              <Select value={filters.resourceType} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { resourceType: v })); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by resource"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  {RESOURCE_TYPES.map(function (type) { return (<SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>); })}
                </SelectContent>
              </Select>

              <Input placeholder="Filter by user ID..." value={filters.userId} onChange={function (e) { return setFilters(__assign(__assign({}, filters), { userId: e.target.value })); }} className="w-40"/>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">Action</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Resource</TableHead>
                  <TableHead className="font-semibold">IP</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(function (log) { return (<TableRow key={log.id} className="hover:bg-gray-50 text-sm">
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">{log.action}</TableCell>
                    <TableCell className="font-mono text-xs">{log.userId.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded">
                        {log.resourceType}:{log.resourceId.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={function () { return setSelectedLog(log); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>); })}
              </TableBody>
            </Table>
            {logs.length === 0 && (<div className="text-center py-8 text-gray-500">No logs match your filters</div>)}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={function () { return setSelectedLog(null); }}>
        <DialogContent className="admin-dialog max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (<>
              <DialogHeader>
                <DialogTitle>{selectedLog.action}</DialogTitle>
                <DialogDescription className="font-mono">{selectedLog.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-sm mt-1 font-mono">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm mt-1 font-mono">{selectedLog.userId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Action</label>
                    <p className="text-sm mt-1 font-mono text-blue-600">{selectedLog.action}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP Address</label>
                    <p className="text-sm mt-1 font-mono">{selectedLog.ip}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resource</label>
                    <p className="text-sm mt-1 font-mono">
                      {selectedLog.resourceType}:{selectedLog.resourceId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Agent</label>
                    <p className="text-sm mt-1 font-mono truncate">{selectedLog.userAgent}</p>
                  </div>
                </div>

                {/* Metadata Section */}
                {Object.keys(selectedLog.metadata).length > 0 && (<div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-500">Metadata</label>
                      <Button size="sm" variant="ghost" onClick={function () { return handleCopyMetadata(selectedLog.metadata); }}>
                        <Copy className="w-4 h-4 mr-1"/> Copy
                      </Button>
                    </div>
                    <pre className="p-3 bg-gray-100 rounded border border-gray-300 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>)}

                {/* Redaction Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <strong>Note:</strong> Sensitive information (PII, API keys, IPs, etc.) has been automatically redacted
                  from this audit log for security compliance.
                </div>

                {/* Close Button */}
                <div className="flex justify-end">
                  <Button onClick={function () { return setSelectedLog(null); }}>Close</Button>
                </div>
              </div>
            </>)}
        </DialogContent>
      </Dialog>
    </div>);
}

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
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from "@/lib/api";
import { AlertCircle, CheckCircle, Clock, X, Download, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
var getSeverityColor = function (severity) {
    switch (severity) {
        case 'low':
            return 'bg-blue-100 text-blue-800';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'high':
            return 'bg-orange-100 text-orange-800';
        case 'critical':
            return 'bg-red-100 text-red-800';
    }
};
var getSeverityIcon = function (severity) {
    switch (severity) {
        case 'low':
            return <AlertCircle className="w-4 h-4"/>;
        case 'medium':
            return <AlertTriangle className="w-4 h-4"/>;
        case 'high':
            return <AlertTriangle className="w-4 h-4"/>;
        case 'critical':
            return <Shield className="w-4 h-4"/>;
    }
};
var getStatusColor = function (status) {
    switch (status) {
        case 'new':
            return 'bg-red-100 text-red-800';
        case 'acknowledged':
            return 'bg-yellow-100 text-yellow-800';
        case 'resolved':
            return 'bg-blue-100 text-blue-800';
        case 'closed':
            return 'bg-green-100 text-green-800';
    }
};
var getStatusIcon = function (status) {
    switch (status) {
        case 'new':
            return <AlertCircle className="w-4 h-4"/>;
        case 'acknowledged':
            return <Clock className="w-4 h-4"/>;
        case 'resolved':
            return <CheckCircle className="w-4 h-4"/>;
        case 'closed':
            return <X className="w-4 h-4"/>;
    }
};
export default function AdminIncidents() {
    var _this = this;
    var _a = useState(null), selectedIncident = _a[0], setSelectedIncident = _a[1];
    var _b = useState({}), filter = _b[0], setFilter = _b[1];
    var _c = useState([]), auditLogs = _c[0], setAuditLogs = _c[1];
    var _d = useQuery({
        queryKey: ['incidents'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(apiUrl('/api/incidents'), { credentials: 'include' })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch incidents');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 10000, // Refresh every 10s
    }), _e = _d.data, incidents = _e === void 0 ? [] : _e, isLoading = _d.isLoading, refetch = _d.refetch;
    var filteredIncidents = useMemo(function () {
        var result = incidents;
        if (filter.status) {
            result = result.filter(function (i) { return i.status === filter.status; });
        }
        if (filter.severity) {
            result = result.filter(function (i) { return i.severity === filter.severity; });
        }
        if (filter.search) {
            var search_1 = filter.search.toLowerCase();
            result = result.filter(function (i) {
                return i.id.toLowerCase().includes(search_1) ||
                    i.ruleId.toLowerCase().includes(search_1);
            });
        }
        return result.sort(function (a, b) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [incidents, filter]);
    var stats = useMemo(function () {
        return {
            total: incidents.length,
            new: incidents.filter(function (i) { return i.status === 'new'; }).length,
            acknowledged: incidents.filter(function (i) { return i.status === 'acknowledged'; }).length,
            resolved: incidents.filter(function (i) { return i.status === 'resolved'; }).length,
            critical: incidents.filter(function (i) { return i.severity === 'critical'; }).length,
        };
    }, [incidents]);
    var handleViewDetails = function (incident) { return __awaiter(_this, void 0, void 0, function () {
        var res, logs, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSelectedIncident(incident);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch(apiUrl("/api/incidents/".concat(incident.id, "/audit-logs")), { credentials: 'include' })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    logs = _a.sent();
                    setAuditLogs(logs);
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to fetch audit logs:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleStatusChange = function (incidentId, newStatus) { return __awaiter(_this, void 0, void 0, function () {
        var res, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch(apiUrl("/api/incidents/".concat(incidentId, "/status")), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),
                            credentials: 'include',
                        })];
                case 1:
                    res = _a.sent();
                    if (res.ok) {
                        refetch();
                        setSelectedIncident(null);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to update incident status:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleDownloadReport = function (incidentId) { return __awaiter(_this, void 0, void 0, function () {
        var res, blob, url, a, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch(apiUrl("/api/incidents/".concat(incidentId, "/report")), { credentials: 'include' })];
                case 1:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.blob()];
                case 2:
                    blob = _a.sent();
                    url = window.URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "incident-".concat(incidentId, ".md");
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('Failed to download report:', error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleVerifySignature = function (incident) { return __awaiter(_this, void 0, void 0, function () {
        var res, result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/incidents/".concat(incident.id, "/verify-signature"))];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    result = _a.sent();
                    alert(result.valid ? '✅ Signature verified - no tampering detected' : '❌ Signature invalid - incident may have been modified');
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.error('Failed to verify signature:', error_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Security Operations Center</h1>
        <p className="text-gray-600">Monitor and manage incidents in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Input placeholder="Search by ID or rule..." value={filter.search || ''} onChange={function (e) { return setFilter(__assign(__assign({}, filter), { search: e.target.value })); }} className="w-48"/>
          <Select value={filter.status || ''} onValueChange={function (value) {
            return setFilter(__assign(__assign({}, filter), { status: value || undefined }));
        }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.severity || ''} onValueChange={function (value) {
            return setFilter(__assign(__assign({}, filter), { severity: value || undefined }));
        }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>{filteredIncidents.length} incidents</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="text-center py-8">Loading...</div>) : (<div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident ID</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map(function (incident) { return (<TableRow key={incident.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs">{incident.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{incident.ruleId}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(incident.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={function () { return handleViewDetails(incident); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>); })}
                </TableBody>
              </Table>
            </div>)}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={function () { return setSelectedIncident(null); }}>
        <DialogContent className="admin-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedIncident && (<>
              <DialogHeader>
                <DialogTitle>Incident Details</DialogTitle>
                <DialogDescription>{selectedIncident.id}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="audit">Audit</TabsTrigger>
                  <TabsTrigger value="signature">Signature</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Severity</label>
                      <Badge className={getSeverityColor(selectedIncident.severity)}>
                        {selectedIncident.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge className={getStatusColor(selectedIncident.status)}>
                        {selectedIncident.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rule ID</label>
                      <p className="text-sm font-mono">{selectedIncident.ruleId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created By</label>
                      <p className="text-sm">{selectedIncident.userId}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedIncident.metadata, null, 2)}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Actions</label>
                    <div className="flex gap-2">
                      {selectedIncident.status === 'new' && (<Button size="sm" onClick={function () { return handleStatusChange(selectedIncident.id, 'acknowledged'); }}>
                          Acknowledge
                        </Button>)}
                      {selectedIncident.status === 'acknowledged' && (<Button size="sm" onClick={function () { return handleStatusChange(selectedIncident.id, 'resolved'); }}>
                          Resolve
                        </Button>)}
                      {selectedIncident.status === 'resolved' && (<Button size="sm" onClick={function () { return handleStatusChange(selectedIncident.id, 'closed'); }}>
                          Close
                        </Button>)}
                      <Button size="sm" variant="outline" onClick={function () { return handleDownloadReport(selectedIncident.id); }}>
                        <Download className="w-4 h-4 mr-1"/>
                        Report
                      </Button>
                      <Button size="sm" variant="outline" onClick={function () { return handleVerifySignature(selectedIncident); }}>
                        <Shield className="w-4 h-4 mr-1"/>
                        Verify
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="text-sm font-medium text-gray-500 w-24">Created</div>
                      <div>
                        <p className="text-sm">{new Date(selectedIncident.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedIncident.acknowledgedAt && (<div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-gray-500 w-24">Acknowledged</div>
                        <div>
                          <p className="text-sm">{new Date(selectedIncident.acknowledgedAt).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">by {selectedIncident.acknowledgedBy}</p>
                        </div>
                      </div>)}
                    {selectedIncident.resolvedAt && (<div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-gray-500 w-24">Resolved</div>
                        <div>
                          <p className="text-sm">{new Date(selectedIncident.resolvedAt).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">by {selectedIncident.resolvedBy}</p>
                        </div>
                      </div>)}
                    {selectedIncident.closedAt && (<div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-gray-500 w-24">Closed</div>
                        <div>
                          <p className="text-sm">{new Date(selectedIncident.closedAt).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">by {selectedIncident.closedBy}</p>
                        </div>
                      </div>)}
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map(function (log) { return (<TableRow key={log.id}>
                            <TableCell>{log.action}</TableCell>
                            <TableCell className="font-mono">{log.userId.slice(0, 8)}</TableCell>
                            <TableCell className="font-mono">{log.ip}</TableCell>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          </TableRow>); })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="signature" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Signature Hash</label>
                    <p className="text-xs font-mono break-all bg-gray-100 p-3 rounded mt-1">
                      {selectedIncident.signatureHash}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                    <p className="font-medium mb-1">✅ Cryptographic Signature</p>
                    <p>This incident is signed with HMAC-SHA256. Any modification to the incident record will invalidate the signature.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>)}
        </DialogContent>
      </Dialog>
    </div>);
}

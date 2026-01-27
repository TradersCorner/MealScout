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
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
var getStatusColor = function (status) {
    switch (status) {
        case 'open':
            return 'bg-red-100 text-red-800';
        case 'under-review':
            return 'bg-yellow-100 text-yellow-800';
        case 'dismissed':
            return 'bg-blue-100 text-blue-800';
        case 'action-taken':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
export default function AdminModerationEvents() {
    var _this = this;
    var _a = useState(null), selectedEvent = _a[0], setSelectedEvent = _a[1];
    var _b = useState({ status: '', severity: '' }), filters = _b[0], setFilters = _b[1];
    var _c = useState(''), action = _c[0], setAction = _c[1];
    var queryClient = useQueryClient();
    var _d = useQuery({
        queryKey: ['moderation-events', filters],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var params, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (filters.status)
                            params.append('status', filters.status);
                        if (filters.severity)
                            params.append('severity', filters.severity);
                        return [4 /*yield*/, fetch("/api/admin/moderation-events?".concat(params))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch events');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 30000,
    }), _e = _d.data, events = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    var updateEventMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/moderation-events/".concat(data.id), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: data.status, actionTaken: data.action }),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to update event');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['moderation-events'] });
            setSelectedEvent(null);
            setAction('');
        },
    });
    var handleReviewEvent = function (eventId, newStatus, actionTaken) {
        updateEventMutation.mutate({ id: eventId, status: newStatus, action: actionTaken });
    };
    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Events</CardTitle>
          <CardDescription>{events.length} events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <Select value={filters.status} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { status: v })); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="action-taken">Action Taken</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { severity: v })); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by severity"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(function (event) { return (<TableRow key={event.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-sm">{event.eventType}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{event.reason}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={function () {
                setSelectedEvent(event);
                setAction(event.actionTaken || '');
            }}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>); })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={function () { return setSelectedEvent(null); }}>
        <DialogContent className="admin-dialog max-w-2xl">
          {selectedEvent && (<>
              <DialogHeader>
                <DialogTitle>{selectedEvent.eventType}</DialogTitle>
                <DialogDescription>{selectedEvent.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Event Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severity</label>
                    <Badge className={"".concat(getSeverityColor(selectedEvent.severity), " mt-1")}>
                      {selectedEvent.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={"".concat(getStatusColor(selectedEvent.status), " mt-1")}>
                      {selectedEvent.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reason</label>
                    <p className="text-sm mt-1">{selectedEvent.reason}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm mt-1">{new Date(selectedEvent.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedEvent.description && (<div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm mt-2 p-3 bg-gray-50 rounded border">{selectedEvent.description}</p>
                  </div>)}

                {/* Review Actions */}
                <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <label className="text-sm font-medium text-gray-700">Take Action</label>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant={action === 'warning' ? 'default' : 'outline'} onClick={function () { return setAction('warning'); }}>
                      <AlertTriangle className="w-4 h-4 mr-1"/> Warning
                    </Button>
                    <Button size="sm" variant={action === 'content-removed' ? 'default' : 'outline'} onClick={function () { return setAction('content-removed'); }}>
                      <XCircle className="w-4 h-4 mr-1"/> Remove Content
                    </Button>
                    <Button size="sm" variant={action === 'suspension' ? 'default' : 'outline'} onClick={function () { return setAction('suspension'); }}>
                      Suspend User
                    </Button>
                    <Button size="sm" variant={action === 'dismissed' ? 'default' : 'outline'} onClick={function () { return setAction('dismissed'); }}>
                      <CheckCircle className="w-4 h-4 mr-1"/> Dismiss
                    </Button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={function () { return setSelectedEvent(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={function () { return handleReviewEvent(selectedEvent.id, 'action-taken', action); }} disabled={!action || updateEventMutation.isPending}>
                    Confirm Action
                  </Button>
                </div>
              </div>
            </>)}
        </DialogContent>
      </Dialog>
    </div>);
}

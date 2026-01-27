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
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
var getPriorityColor = function (priority) {
    switch (priority) {
        case 'critical':
            return 'bg-red-100 text-red-800';
        case 'high':
            return 'bg-orange-100 text-orange-800';
        case 'normal':
            return 'bg-blue-100 text-blue-800';
        case 'low':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
var getStatusColor = function (status) {
    switch (status) {
        case 'open':
            return 'bg-red-100 text-red-800';
        case 'in-progress':
            return 'bg-yellow-100 text-yellow-800';
        case 'resolved':
            return 'bg-blue-100 text-blue-800';
        case 'closed':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
var getStatusIcon = function (status) {
    switch (status) {
        case 'open':
            return <AlertCircle className="w-4 h-4"/>;
        case 'in-progress':
            return <Clock className="w-4 h-4"/>;
        case 'resolved':
            return <CheckCircle className="w-4 h-4"/>;
        case 'closed':
            return <CheckCircle className="w-4 h-4"/>;
        default:
            return null;
    }
};
export default function AdminSupportTickets() {
    var _this = this;
    var _a = useState(null), selectedTicket = _a[0], setSelectedTicket = _a[1];
    var _b = useState({ status: '', priority: '' }), filters = _b[0], setFilters = _b[1];
    var _c = useState(''), adminNotes = _c[0], setAdminNotes = _c[1];
    var queryClient = useQueryClient();
    var _d = useQuery({
        queryKey: ['support-tickets', filters],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var params, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (filters.status)
                            params.append('status', filters.status);
                        if (filters.priority)
                            params.append('priority', filters.priority);
                        return [4 /*yield*/, fetch("/api/admin/support-tickets?".concat(params))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch tickets');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        refetchInterval: 30000,
    }), _e = _d.data, tickets = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    var updateTicketMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/admin/support-tickets/".concat(data.id), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: data.status, adminNotes: data.notes }),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to update ticket');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            setSelectedTicket(null);
            setAdminNotes('');
        },
    });
    var handleStatusChange = function (ticketId, newStatus) {
        updateTicketMutation.mutate({ id: ticketId, status: newStatus, notes: adminNotes });
    };
    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>{tickets.length} tickets</CardDescription>
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
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={function (v) { return setFilters(__assign(__assign({}, filters), { priority: v })); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by priority"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(function (ticket) { return (<TableRow key={ticket.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell className="text-sm">{ticket.category}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status.toUpperCase()}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={function () {
                setSelectedTicket(ticket);
                setAdminNotes(ticket.adminNotes || '');
            }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>); })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={function () { return setSelectedTicket(null); }}>
        <DialogContent className="admin-dialog max-w-2xl">
          {selectedTicket && (<>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
                <DialogDescription>{selectedTicket.id}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-sm mt-1">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <Badge className={"".concat(getPriorityColor(selectedTicket.priority), " mt-1")}>
                      {selectedTicket.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={"".concat(getStatusColor(selectedTicket.status), " mt-1")}>
                      {selectedTicket.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm mt-1">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm mt-2 p-3 bg-gray-50 rounded border">{selectedTicket.description}</p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <Textarea value={adminNotes} onChange={function (e) { return setAdminNotes(e.target.value); }} placeholder="Add internal notes..." className="mt-2 min-h-24"/>
                </div>

                {/* Status Update */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Update Status</label>
                  <div className="flex gap-2 mt-2">
                    {selectedTicket.status === 'open' && (<>
                        <Button size="sm" onClick={function () { return handleStatusChange(selectedTicket.id, 'in-progress'); }} disabled={updateTicketMutation.isPending}>
                          Mark In Progress
                        </Button>
                      </>)}
                    {selectedTicket.status === 'in-progress' && (<>
                        <Button size="sm" onClick={function () { return handleStatusChange(selectedTicket.id, 'resolved'); }} disabled={updateTicketMutation.isPending}>
                          Mark Resolved
                        </Button>
                      </>)}
                    {selectedTicket.status === 'resolved' && (<>
                        <Button size="sm" onClick={function () { return handleStatusChange(selectedTicket.id, 'closed'); }} disabled={updateTicketMutation.isPending}>
                          Close Ticket
                        </Button>
                      </>)}
                    <Button size="sm" variant="outline" onClick={function () {
                setAdminNotes('');
                setSelectedTicket(null);
            }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </>)}
        </DialogContent>
      </Dialog>
    </div>);
}

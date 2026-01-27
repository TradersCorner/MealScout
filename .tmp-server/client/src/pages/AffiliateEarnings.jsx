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
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Share2, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
export default function AffiliateEarnings() {
    var _this = this;
    var _a;
    var _b = useAuth(), isAuthenticated = _b.isAuthenticated, authState = _b.authState;
    var queryClient = useQueryClient();
    var _c = useState(false), withdrawalDialog = _c[0], setWithdrawalDialog = _c[1];
    var _d = useState(''), withdrawalAmount = _d[0], setWithdrawalAmount = _d[1];
    var _e = useState('paypal'), withdrawalMethod = _e[0], setWithdrawalMethod = _e[1];
    var _f = useState({
        paypalEmail: '',
        achAccountName: '',
        achBankName: '',
        achRoutingNumber: '',
        achAccountNumber: '',
        otherInstructions: '',
    }), withdrawalDetails = _f[0], setWithdrawalDetails = _f[1];
    var _g = useState(''), withdrawalNotes = _g[0], setWithdrawalNotes = _g[1];
    var _h = useState(null), withdrawalError = _h[0], setWithdrawalError = _h[1];
    var _j = useState(false), withdrawalSubmitting = _j[0], setWithdrawalSubmitting = _j[1];
    var _k = useState(''), affiliateTag = _k[0], setAffiliateTag = _k[1];
    var _l = useState(''), tagInput = _l[0], setTagInput = _l[1];
    var _m = useState(false), tagSaving = _m[0], setTagSaving = _m[1];
    var _o = useState(null), tagError = _o[0], setTagError = _o[1];
    var stats = useQuery({
        queryKey: ['affiliate-stats'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(apiUrl('/api/affiliate/stats'), { credentials: 'include' })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch stats');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        enabled: isAuthenticated,
        refetchInterval: 30000,
    }).data;
    var withdrawalsData = useQuery({
        queryKey: ['affiliate-withdrawals'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(apiUrl('/api/affiliate/withdrawals'), { credentials: 'include' })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch withdrawals');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        enabled: isAuthenticated,
    }).data;
    var tagData = useQuery({
        queryKey: ['affiliate-tag'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(apiUrl('/api/affiliate/tag'), { credentials: 'include' })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch affiliate tag');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        enabled: isAuthenticated,
    }).data;
    useEffect(function () {
        if (tagData === null || tagData === void 0 ? void 0 : tagData.tag) {
            setAffiliateTag(tagData.tag);
            setTagInput(tagData.tag);
        }
    }, [tagData === null || tagData === void 0 ? void 0 : tagData.tag]);
    var handleCopyLink = function (url) {
        navigator.clipboard.writeText(url);
    };
    var formatCurrency = function (amount) {
        var num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(num || 0);
    };
    var formatDate = function (value) {
        if (!value)
            return '—';
        var date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    var handleWithdrawalSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var availableBalance, amountNum, methodDetails, res, data, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    availableBalance = (_a = stats === null || stats === void 0 ? void 0 : stats.wallet.availableBalance) !== null && _a !== void 0 ? _a : 0;
                    amountNum = parseFloat(withdrawalAmount);
                    if (!amountNum || Number.isNaN(amountNum)) {
                        setWithdrawalError('Enter a valid amount.');
                        return [2 /*return*/];
                    }
                    if (amountNum < 5) {
                        setWithdrawalError('Minimum cashout is $5.');
                        return [2 /*return*/];
                    }
                    if (amountNum > availableBalance) {
                        setWithdrawalError('Amount exceeds your available balance.');
                        return [2 /*return*/];
                    }
                    methodDetails = {};
                    if (withdrawalMethod === 'paypal') {
                        if (!withdrawalDetails.paypalEmail.trim()) {
                            setWithdrawalError('PayPal email is required.');
                            return [2 /*return*/];
                        }
                        methodDetails.paypalEmail = withdrawalDetails.paypalEmail.trim();
                    }
                    if (withdrawalMethod === 'ach') {
                        if (!withdrawalDetails.achAccountName.trim() ||
                            !withdrawalDetails.achBankName.trim() ||
                            !withdrawalDetails.achRoutingNumber.trim() ||
                            !withdrawalDetails.achAccountNumber.trim()) {
                            setWithdrawalError('All ACH fields are required.');
                            return [2 /*return*/];
                        }
                        methodDetails.accountName = withdrawalDetails.achAccountName.trim();
                        methodDetails.bankName = withdrawalDetails.achBankName.trim();
                        methodDetails.routingNumber = withdrawalDetails.achRoutingNumber.trim();
                        methodDetails.accountNumber = withdrawalDetails.achAccountNumber.trim();
                    }
                    if (withdrawalMethod === 'other') {
                        if (!withdrawalDetails.otherInstructions.trim()) {
                            setWithdrawalError('Please add payout instructions.');
                            return [2 /*return*/];
                        }
                        methodDetails.instructions = withdrawalDetails.otherInstructions.trim();
                    }
                    setWithdrawalSubmitting(true);
                    setWithdrawalError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch(apiUrl('/api/affiliate/withdraw'), {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                amount: amountNum,
                                method: withdrawalMethod,
                                methodDetails: methodDetails,
                                notes: withdrawalNotes.trim() || undefined,
                            }),
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    if (!res.ok) {
                        throw new Error((data === null || data === void 0 ? void 0 : data.error) || 'Failed to request cashout');
                    }
                    setWithdrawalAmount('');
                    setWithdrawalNotes('');
                    setWithdrawalDetails({
                        paypalEmail: '',
                        achAccountName: '',
                        achBankName: '',
                        achRoutingNumber: '',
                        achAccountNumber: '',
                        otherInstructions: '',
                    });
                    setWithdrawalDialog(false);
                    queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _b.sent();
                    setWithdrawalError((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Failed to request cashout.');
                    return [3 /*break*/, 6];
                case 5:
                    setWithdrawalSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveTag = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data_1, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!tagInput.trim()) {
                        setTagError('Please enter a valid tag.');
                        return [2 /*return*/];
                    }
                    setTagSaving(true);
                    setTagError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch(apiUrl('/api/affiliate/tag'), {
                            method: 'PUT',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tag: tagInput.trim() }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _a.sent();
                    throw new Error(data_1.error || 'Failed to update tag');
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = _a.sent();
                    setAffiliateTag(data.tag);
                    setTagInput(data.tag);
                    return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    setTagError(error_2.message || 'Failed to update tag.');
                    return [3 /*break*/, 8];
                case 7:
                    setTagSaving(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    if (authState === 'loading') {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (!isAuthenticated) {
        return (<div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to view your affiliate earnings</h1>
        <p className="text-gray-600 mb-4 max-w-md">
          Create a free MealScout account or sign in to access your affiliate dashboard, track earnings, and manage your links.
        </p>
        <div className="flex gap-3">
          <a href="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">
            Sign In
          </a>
          <a href="/customer-signup?role=affiliate" className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50">
            Create Affiliate Account
          </a>
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Earn commissions when MealScout gets paid on subscriptions you refer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Tag</CardTitle>
          <CardDescription>
            Every link you share uses this tag. You can customize it once or keep the default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex-1">
              <input type="text" value={tagInput} onChange={function (e) { return setTagInput(e.target.value); }} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="user1234"/>
            </div>
            <Button onClick={handleSaveTag} disabled={tagSaving}>
              {tagSaving ? 'Saving...' : 'Save Tag'}
            </Button>
          </div>
          {tagError ? (<p className="text-xs text-red-600">{tagError}</p>) : (<p className="text-xs text-gray-500">
              Current tag: <span className="font-medium text-gray-700">{affiliateTag || 'user1234'}</span>
            </p>)}
        </CardContent>
      </Card>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((stats === null || stats === void 0 ? void 0 : stats.wallet.totalEarned) || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency((stats === null || stats === void 0 ? void 0 : stats.wallet.availableBalance) || 0)}
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full bg-green-600 text-white hover:bg-green-700" onClick={function () { return setWithdrawalDialog(true); }} disabled={!stats || parseFloat(stats.wallet.availableBalance.toString()) < 5}>
              Request Cashout
            </Button>
            <p className="mt-2 text-xs text-green-700">
              Cashouts are manual. You can also spend credits on bookings or monthly fees.
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending Cashouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency((stats === null || stats === void 0 ? void 0 : stats.wallet.pendingCommissions) || 0)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting manual payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats === null || stats === void 0 ? void 0 : stats.stats.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {(stats === null || stats === void 0 ? void 0 : stats.stats.totalConversions) || 0} of {(stats === null || stats === void 0 ? void 0 : stats.stats.totalClicks) || 0} clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">My Links</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(stats === null || stats === void 0 ? void 0 : stats.stats.totalLinks) || 0}</div>
                <p className="text-xs text-gray-500 mt-2">Tracking URLs you've shared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(stats === null || stats === void 0 ? void 0 : stats.stats.totalClicks) || 0}</div>
                <p className="text-xs text-gray-500 mt-2">People visited your link</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(stats === null || stats === void 0 ? void 0 : stats.stats.totalConversions) || 0}</div>
                <p className="text-xs text-gray-500 mt-2">Restaurant signups</p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How You Earn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Share2 className="w-5 h-5 text-blue-600"/>
                </div>
                <div>
                  <h4 className="font-medium">1. Share a Link</h4>
                  <p className="text-sm text-gray-600">
                    Share any restaurant, deal, or collection from MealScout
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600"/>
                </div>
                <div>
                  <h4 className="font-medium">2. Someone Signs Up</h4>
                  <p className="text-sm text-gray-600">
                    A restaurant owner clicks your link and becomes a paid subscriber
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-green-600"/>
                </div>
                <div>
                  <h4 className="font-medium">3. Earn Recurring Commissions</h4>
                  <p className="text-sm text-gray-600">
                    Get 10% of their subscription value every month they stay active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Your Affiliate Links</CardTitle>
              <CardDescription>Links you've shared with your affiliate tracking code</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.recentLinks.length > 0 ? (<div className="space-y-3">
                  {stats.recentLinks.map(function (link) { return (<div key={link.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-mono text-sm font-medium">{link.code}</p>
                        <p className="text-xs text-gray-500 truncate">{link.fullUrl}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{link.resourceType}</Badge>
                          <span className="text-xs text-gray-500">
                            {link.clickCount || 0} clicks • {link.conversions || 0} signups
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={function () { return handleCopyLink(link.fullUrl); }}>
                        <Copy className="w-4 h-4"/>
                      </Button>
                    </div>); })}
                </div>) : (<p className="text-center text-gray-500 py-8">
                  No links yet. Start sharing to earn!
                </p>)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commission History</CardTitle>
              <CardDescription>Detailed breakdown of your monthly earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm text-gray-500">
                        Commissions will appear here
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track your cash outs and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((_a = withdrawalsData === null || withdrawalsData === void 0 ? void 0 : withdrawalsData.withdrawals) === null || _a === void 0 ? void 0 : _a.length) ? (withdrawalsData.withdrawals.map(function (withdrawal) { return (<TableRow key={withdrawal.id}>
                          <TableCell>{formatDate(withdrawal.requestedAt)}</TableCell>
                          <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                          <TableCell className="capitalize">{withdrawal.method}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={withdrawal.status === 'completed'
                ? 'border-green-200 text-green-700'
                : withdrawal.status === 'rejected'
                    ? 'border-red-200 text-red-700'
                    : 'border-yellow-200 text-yellow-700'}>
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                        </TableRow>); })) : (<TableRow>
                        <TableCell className="text-sm text-gray-500">
                          No withdrawals yet
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawalDialog} onOpenChange={setWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Cashout</DialogTitle>
            <DialogDescription>
              Minimum cashout: $5. Requests are reviewed manually. Available: {formatCurrency((stats === null || stats === void 0 ? void 0 : stats.wallet.availableBalance) || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="flex mt-2">
                <span className="inline-flex items-center px-3 bg-gray-100 rounded-l-md">
                  $
                </span>
                <input type="number" min="5" step="0.01" value={withdrawalAmount} onChange={function (e) { return setWithdrawalAmount(e.target.value); }} className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md" placeholder="0.00"/>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Withdrawal Method</label>
              <select value={withdrawalMethod} onChange={function (e) {
            setWithdrawalMethod(e.target.value);
            setWithdrawalError(null);
        }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2">
                <option value="paypal">PayPal</option>
                <option value="ach">ACH (Bank Transfer)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {withdrawalMethod === 'paypal' && (<div>
                <label className="text-sm font-medium">PayPal Email</label>
                <input type="email" value={withdrawalDetails.paypalEmail} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { paypalEmail: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="name@example.com"/>
              </div>)}

            {withdrawalMethod === 'ach' && (<div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Account Holder Name</label>
                  <input type="text" value={withdrawalDetails.achAccountName} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { achAccountName: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="Full name on account"/>
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <input type="text" value={withdrawalDetails.achBankName} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { achBankName: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="Your bank"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Routing Number</label>
                    <input type="text" value={withdrawalDetails.achRoutingNumber} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { achRoutingNumber: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="9-digit routing"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Number</label>
                    <input type="text" value={withdrawalDetails.achAccountNumber} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { achAccountNumber: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="Account number"/>
                  </div>
                </div>
              </div>)}

            {withdrawalMethod === 'other' && (<div>
                <label className="text-sm font-medium">Payout Instructions</label>
                <textarea value={withdrawalDetails.otherInstructions} onChange={function (e) {
                return setWithdrawalDetails(function (prev) { return (__assign(__assign({}, prev), { otherInstructions: e.target.value })); });
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="Tell us how you want to be paid (PayPal, ACH, check, etc.)"/>
              </div>)}

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea value={withdrawalNotes} onChange={function (e) { return setWithdrawalNotes(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2" placeholder="Any extra details or preferred timing"/>
            </div>

            {withdrawalError && (<p className="text-sm text-red-600">{withdrawalError}</p>)}

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50" onClick={function () { return setWithdrawalDialog(false); }} disabled={withdrawalSubmitting}>
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-70" onClick={handleWithdrawalSubmit} disabled={withdrawalSubmitting}>
                {withdrawalSubmitting ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}

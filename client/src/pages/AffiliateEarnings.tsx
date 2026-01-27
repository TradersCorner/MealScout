import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Share2, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  wallet: {
    totalEarned: number;
    availableBalance: number;
    pendingCommissions: number;
    totalWithdrawn: number;
    totalSpent: number;
  };
  stats: {
    totalLinks: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: string;
    pendingMonthlyCount: number;
  };
  recentLinks: any[];
}

interface Withdrawal {
  id: string;
  amount: number | string;
  method: string;
  status: string;
  methodDetails?: Record<string, any> | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  rejectedAt?: string | null;
  notes?: string | null;
}

export default function AffiliateEarnings() {
  const { isAuthenticated, authState } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'paypal' | 'ach' | 'other'>('paypal');
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    paypalEmail: '',
    achAccountName: '',
    achBankName: '',
    achRoutingNumber: '',
    achAccountNumber: '',
    otherInstructions: '',
  });
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [affiliateTag, setAffiliateTag] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const { data: stats } = useQuery<Stats>({
    queryKey: ['affiliate-stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/affiliate/stats'), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: withdrawalsData } = useQuery<{ withdrawals: Withdrawal[] }>({
    queryKey: ['affiliate-withdrawals'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/affiliate/withdrawals'), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch withdrawals');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: tagData } = useQuery<{ tag: string }>({
    queryKey: ['affiliate-tag'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/affiliate/tag'), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch affiliate tag');
      return res.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (tagData?.tag) {
      setAffiliateTag(tagData.tag);
      setTagInput(tagData.tag);
    }
  }, [tagData?.tag]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num || 0);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleWithdrawalSubmit = async () => {
    const availableBalance = stats?.wallet.availableBalance ?? 0;
    const amountNum = parseFloat(withdrawalAmount);
    if (!amountNum || Number.isNaN(amountNum)) {
      setWithdrawalError('Enter a valid amount.');
      return;
    }
    if (amountNum < 5) {
      setWithdrawalError('Minimum cashout is $5.');
      return;
    }
    if (amountNum > availableBalance) {
      setWithdrawalError('Amount exceeds your available balance.');
      return;
    }

    const methodDetails: Record<string, string> = {};
    if (withdrawalMethod === 'paypal') {
      if (!withdrawalDetails.paypalEmail.trim()) {
        setWithdrawalError('PayPal email is required.');
        return;
      }
      methodDetails.paypalEmail = withdrawalDetails.paypalEmail.trim();
    }

    if (withdrawalMethod === 'ach') {
      if (
        !withdrawalDetails.achAccountName.trim() ||
        !withdrawalDetails.achBankName.trim() ||
        !withdrawalDetails.achRoutingNumber.trim() ||
        !withdrawalDetails.achAccountNumber.trim()
      ) {
        setWithdrawalError('All ACH fields are required.');
        return;
      }
      methodDetails.accountName = withdrawalDetails.achAccountName.trim();
      methodDetails.bankName = withdrawalDetails.achBankName.trim();
      methodDetails.routingNumber = withdrawalDetails.achRoutingNumber.trim();
      methodDetails.accountNumber = withdrawalDetails.achAccountNumber.trim();
    }

    if (withdrawalMethod === 'other') {
      if (!withdrawalDetails.otherInstructions.trim()) {
        setWithdrawalError('Please add payout instructions.');
        return;
      }
      methodDetails.instructions = withdrawalDetails.otherInstructions.trim();
    }

    setWithdrawalSubmitting(true);
    setWithdrawalError(null);
    try {
      const res = await fetch(apiUrl('/api/affiliate/withdraw'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          method: withdrawalMethod,
          methodDetails,
          notes: withdrawalNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to request cashout');
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
    } catch (error: any) {
      setWithdrawalError(error?.message || 'Failed to request cashout.');
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const handleSaveTag = async () => {
    if (!tagInput.trim()) {
      setTagError('Please enter a valid tag.');
      return;
    }
    setTagSaving(true);
    setTagError(null);
    try {
      const res = await fetch(apiUrl('/api/affiliate/tag'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tag');
      }
      const data = await res.json();
      setAffiliateTag(data.tag);
      setTagInput(data.tag);
    } catch (error: any) {
      setTagError(error.message || 'Failed to update tag.');
    } finally {
      setTagSaving(false);
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="user1234"
              />
            </div>
            <Button onClick={handleSaveTag} disabled={tagSaving}>
              {tagSaving ? 'Saving...' : 'Save Tag'}
            </Button>
          </div>
          {tagError ? (
            <p className="text-xs text-red-600">{tagError}</p>
          ) : (
            <p className="text-xs text-gray-500">
              Current tag: <span className="font-medium text-gray-700">{affiliateTag || 'user1234'}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.wallet.totalEarned || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.wallet.availableBalance || 0)}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full bg-green-600 text-white hover:bg-green-700"
              onClick={() => setWithdrawalDialog(true)}
              disabled={!stats || parseFloat(stats.wallet.availableBalance.toString()) < 5}
            >
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
              {formatCurrency(stats?.wallet.pendingCommissions || 0)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting manual payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats.conversionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.stats.totalConversions || 0} of {stats?.stats.totalClicks || 0} clicks
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
                <div className="text-3xl font-bold">{stats?.stats.totalLinks || 0}</div>
                <p className="text-xs text-gray-500 mt-2">Tracking URLs you've shared</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.stats.totalClicks || 0}</div>
                <p className="text-xs text-gray-500 mt-2">People visited your link</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.stats.totalConversions || 0}</div>
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
                  <Share2 className="w-5 h-5 text-blue-600" />
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
                  <TrendingUp className="w-5 h-5 text-blue-600" />
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
                  <DollarSign className="w-5 h-5 text-green-600" />
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
              {stats && stats.recentLinks.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(link.fullUrl)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No links yet. Start sharing to earn!
                </p>
              )}
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
                    {withdrawalsData?.withdrawals?.length ? (
                      withdrawalsData.withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{formatDate(withdrawal.requestedAt)}</TableCell>
                          <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                          <TableCell className="capitalize">{withdrawal.method}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                withdrawal.status === 'completed'
                                  ? 'border-green-200 text-green-700'
                                  : withdrawal.status === 'rejected'
                                  ? 'border-red-200 text-red-700'
                                  : 'border-yellow-200 text-yellow-700'
                              }
                            >
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-sm text-gray-500">
                          No withdrawals yet
                        </TableCell>
                      </TableRow>
                    )}
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
              Minimum cashout: $5. Requests are reviewed manually. Available: {formatCurrency(stats?.wallet.availableBalance || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="flex mt-2">
                <span className="inline-flex items-center px-3 bg-gray-100 rounded-l-md">
                  $
                </span>
                <input
                  type="number"
                  min="5"
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Withdrawal Method</label>
              <select
                value={withdrawalMethod}
                onChange={(e) => {
                  setWithdrawalMethod(e.target.value as 'paypal' | 'ach' | 'other');
                  setWithdrawalError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
              >
                <option value="paypal">PayPal</option>
                <option value="ach">ACH (Bank Transfer)</option>
                <option value="other">Other</option>
              </select>
            </div>

            {withdrawalMethod === 'paypal' && (
              <div>
                <label className="text-sm font-medium">PayPal Email</label>
                <input
                  type="email"
                  value={withdrawalDetails.paypalEmail}
                  onChange={(e) =>
                    setWithdrawalDetails((prev) => ({ ...prev, paypalEmail: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  placeholder="name@example.com"
                />
              </div>
            )}

            {withdrawalMethod === 'ach' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Account Holder Name</label>
                  <input
                    type="text"
                    value={withdrawalDetails.achAccountName}
                    onChange={(e) =>
                      setWithdrawalDetails((prev) => ({ ...prev, achAccountName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                    placeholder="Full name on account"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <input
                    type="text"
                    value={withdrawalDetails.achBankName}
                    onChange={(e) =>
                      setWithdrawalDetails((prev) => ({ ...prev, achBankName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                    placeholder="Your bank"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Routing Number</label>
                    <input
                      type="text"
                      value={withdrawalDetails.achRoutingNumber}
                      onChange={(e) =>
                        setWithdrawalDetails((prev) => ({ ...prev, achRoutingNumber: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                      placeholder="9-digit routing"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Number</label>
                    <input
                      type="text"
                      value={withdrawalDetails.achAccountNumber}
                      onChange={(e) =>
                        setWithdrawalDetails((prev) => ({ ...prev, achAccountNumber: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                      placeholder="Account number"
                    />
                  </div>
                </div>
              </div>
            )}

            {withdrawalMethod === 'other' && (
              <div>
                <label className="text-sm font-medium">Payout Instructions</label>
                <textarea
                  value={withdrawalDetails.otherInstructions}
                  onChange={(e) =>
                    setWithdrawalDetails((prev) => ({ ...prev, otherInstructions: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  placeholder="Tell us how you want to be paid (PayPal, ACH, check, etc.)"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                value={withdrawalNotes}
                onChange={(e) => setWithdrawalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                placeholder="Any extra details or preferred timing"
              />
            </div>

            {withdrawalError && (
              <p className="text-sm text-red-600">{withdrawalError}</p>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                onClick={() => setWithdrawalDialog(false)}
                disabled={withdrawalSubmitting}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
                onClick={handleWithdrawalSubmit}
                disabled={withdrawalSubmitting}
              >
                {withdrawalSubmitting ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

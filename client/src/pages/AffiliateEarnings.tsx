import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Share2, TrendingUp, DollarSign, RefreshCw, Download } from 'lucide-react';
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

export default function AffiliateEarnings() {
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');

  const { data: stats } = useQuery<Stats>({
    queryKey: ['affiliate-stats'],
    queryFn: async () => {
      const res = await fetch('/api/affiliate/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000,
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Earn recurring commissions by sharing restaurants from MealScout
        </p>
      </div>

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
              Withdraw
            </Button>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats?.wallet.pendingCommissions || 0)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Next 30 days</p>
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
                    <TableRow>
                      <TableCell className="text-sm text-gray-500">
                        No withdrawals yet
                      </TableCell>
                    </TableRow>
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
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Minimum withdrawal: $5. Available: {formatCurrency(stats?.wallet.availableBalance || 0)}
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
                onChange={(e) => setWithdrawalMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="store_credit">Store Credit (Instant)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
                onClick={() => setWithdrawalDialog(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                onClick={() => {
                  // Handle withdrawal
                  setWithdrawalDialog(false);
                }}
              >
                Request Withdrawal
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

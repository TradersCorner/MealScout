/**
 * PHASE R1: Restaurant Credit Redemption Form
 * 
 * Allows restaurants to accept MealScout credits as payment
 * 
 * Features:
 * - User search/autocomplete
 * - Credit amount input with balance validation
 * - Order reference for tracking
 * - Notes for context
 * - Real-time user balance display
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface AcceptCreditsPayload {
  userId: string;
  creditAmount: number;
  orderReference?: string;
  notes?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface RestaurantCreditRedemptionFormProps {
  restaurantId: string;
  onSuccess?: (redemption: any) => void;
}

const RestaurantCreditRedemptionForm: React.FC<RestaurantCreditRedemptionFormProps> = ({
  restaurantId,
  onSuccess,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [orderReference, setOrderReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  // Fetch user credit balance
  const { data: userBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['userBalance', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const response = await axios.get(`/api/users/${selectedUserId}/balance`);
      return response.data.balance;
    },
    enabled: !!selectedUserId,
  });

  // Search users for autocomplete
  const { data: searchResults } = useQuery({
    queryKey: ['searchUsers', userSearch],
    queryFn: async () => {
      if (userSearch.length < 2) return [];
      const response = await axios.get('/api/users/search', {
        params: { q: userSearch, limit: 5 },
      });
      return response.data.users;
    },
    enabled: userSearch.length >= 2,
  });

  // Accept credits mutation
  const acceptCreditsMutation = useMutation({
    mutationFn: async (payload: AcceptCreditsPayload) => {
      const response = await axios.post(
        `/api/restaurants/${restaurantId}/accept-credits`,
        payload,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Reset form
      setSelectedUserId('');
      setCreditAmount(0);
      setOrderReference('');
      setNotes('');
      setUserSearch('');

      onSuccess?.(data);
    },
  });

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setUserSearch(user.email);
    setShowUserSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || creditAmount <= 0) {
      alert('Please select a user and enter a credit amount');
      return;
    }

    if (userBalance && creditAmount > userBalance) {
      alert(`User only has $${userBalance} available`);
      return;
    }

    acceptCreditsMutation.mutate({
      userId: selectedUserId,
      creditAmount,
      orderReference: orderReference || undefined,
      notes: notes || undefined,
    });
  };

  const isFormValid = selectedUserId && creditAmount > 0 && (!userBalance || creditAmount <= userBalance);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Accept MealScout Credits</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setShowUserSuggestions(true);
              }}
              placeholder="Search by email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Autocomplete Suggestions */}
            {showUserSuggestions && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10">
                {searchResults.map((user: User) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Balance Display */}
          {selectedUserId && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {balanceLoading ? (
                <p className="text-sm text-gray-600">Loading balance...</p>
              ) : userBalance !== undefined ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Available balance: <span className="font-bold text-blue-600">${userBalance.toFixed(2)}</span>
                  </p>
                  {creditAmount > userBalance && (
                    <p className="text-sm text-red-600">
                      ⚠️ Credit amount exceeds available balance
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-600">Unable to fetch user balance</p>
              )}
            </div>
          )}
        </div>

        {/* Credit Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Credit Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {creditAmount > 0 && (
            <p className="text-sm text-gray-600">
              User will have ${((userBalance || 0) - creditAmount).toFixed(2)} remaining after this redemption
            </p>
          )}
        </div>

        {/* Order Reference */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Order Reference <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={orderReference}
            onChange={(e) => setOrderReference(e.target.value)}
            placeholder="e.g., Order #12345 or Invoice ABC123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any details about this redemption..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">How it works:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>User's credit balance is immediately deducted</li>
            <li>Credit goes into pending settlement (settled weekly, Sundays)</li>
            <li>You'll receive a Stripe payout when the batch is processed</li>
            <li>User can dispute within 7 days of redemption</li>
          </ul>
        </div>

        {/* Success/Error Messages */}
        {acceptCreditsMutation.isSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              ✓ Credit redeemed successfully!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Redemption ID: {acceptCreditsMutation.data?.redemption?.id}
            </p>
          </div>
        )}

        {acceptCreditsMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Error: {acceptCreditsMutation.error instanceof Error ? acceptCreditsMutation.error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || acceptCreditsMutation.isPending}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isFormValid && !acceptCreditsMutation.isPending
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {acceptCreditsMutation.isPending ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Processing...
            </>
          ) : (
            'Accept Credits'
          )}
        </button>
      </form>
    </div>
  );
};

export default RestaurantCreditRedemptionForm;

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
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
var RestaurantCreditRedemptionForm = function (_a) {
    var _b, _c;
    var restaurantId = _a.restaurantId, onSuccess = _a.onSuccess;
    var _d = useState(''), selectedUserId = _d[0], setSelectedUserId = _d[1];
    var _e = useState(0), creditAmount = _e[0], setCreditAmount = _e[1];
    var _f = useState(''), orderReference = _f[0], setOrderReference = _f[1];
    var _g = useState(''), notes = _g[0], setNotes = _g[1];
    var _h = useState(''), userSearch = _h[0], setUserSearch = _h[1];
    var _j = useState(false), showUserSuggestions = _j[0], setShowUserSuggestions = _j[1];
    // Fetch user credit balance
    var _k = useQuery({
        queryKey: ['userBalance', selectedUserId],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!selectedUserId)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, axios.get("/api/users/".concat(selectedUserId, "/balance"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.balance];
                }
            });
        }); },
        enabled: !!selectedUserId,
    }), userBalance = _k.data, balanceLoading = _k.isLoading;
    // Search users for autocomplete
    var searchResults = useQuery({
        queryKey: ['searchUsers', userSearch],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (userSearch.length < 2)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, axios.get('/api/users/search', {
                                params: { q: userSearch, limit: 5 },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.users];
                }
            });
        }); },
        enabled: userSearch.length >= 2,
    }).data;
    // Accept credits mutation
    var acceptCreditsMutation = useMutation({
        mutationFn: function (payload) { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.post("/api/restaurants/".concat(restaurantId, "/accept-credits"), payload)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (data) {
            // Reset form
            setSelectedUserId('');
            setCreditAmount(0);
            setOrderReference('');
            setNotes('');
            setUserSearch('');
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(data);
        },
    });
    var handleUserSelect = function (user) {
        setSelectedUserId(user.id);
        setUserSearch(user.email);
        setShowUserSuggestions(false);
    };
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!selectedUserId || creditAmount <= 0) {
            alert('Please select a user and enter a credit amount');
            return;
        }
        if (userBalance && creditAmount > userBalance) {
            alert("User only has $".concat(userBalance, " available"));
            return;
        }
        acceptCreditsMutation.mutate({
            userId: selectedUserId,
            creditAmount: creditAmount,
            orderReference: orderReference || undefined,
            notes: notes || undefined,
        });
    };
    var isFormValid = selectedUserId && creditAmount > 0 && (!userBalance || creditAmount <= userBalance);
    return (<div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Accept MealScout Credits</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type="text" value={userSearch} onChange={function (e) {
            setUserSearch(e.target.value);
            setShowUserSuggestions(true);
        }} placeholder="Search by email..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>

            {/* Autocomplete Suggestions */}
            {showUserSuggestions && searchResults && searchResults.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10">
                {searchResults.map(function (user) { return (<button key={user.id} type="button" onClick={function () { return handleUserSelect(user); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0">
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </button>); })}
              </div>)}
          </div>

          {/* User Balance Display */}
          {selectedUserId && (<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {balanceLoading ? (<p className="text-sm text-gray-600">Loading balance...</p>) : userBalance !== undefined ? (<div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Available balance: <span className="font-bold text-blue-600">${userBalance.toFixed(2)}</span>
                  </p>
                  {creditAmount > userBalance && (<p className="text-sm text-red-600">
                      ⚠️ Credit amount exceeds available balance
                    </p>)}
                </div>) : (<p className="text-sm text-red-600">Unable to fetch user balance</p>)}
            </div>)}
        </div>

        {/* Credit Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Credit Amount ($) <span className="text-red-500">*</span>
          </label>
          <input type="number" value={creditAmount} onChange={function (e) { return setCreditAmount(parseFloat(e.target.value) || 0); }} step="0.01" min="0" placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          {creditAmount > 0 && (<p className="text-sm text-gray-600">
              User will have ${((userBalance || 0) - creditAmount).toFixed(2)} remaining after this redemption
            </p>)}
        </div>

        {/* Order Reference */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Order Reference <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input type="text" value={orderReference} onChange={function (e) { return setOrderReference(e.target.value); }} placeholder="e.g., Order #12345 or Invoice ABC123" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea value={notes} onChange={function (e) { return setNotes(e.target.value); }} placeholder="Add any details about this redemption..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"/>
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
        {acceptCreditsMutation.isSuccess && (<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              ✓ Credit redeemed successfully!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Redemption ID: {(_c = (_b = acceptCreditsMutation.data) === null || _b === void 0 ? void 0 : _b.redemption) === null || _c === void 0 ? void 0 : _c.id}
            </p>
          </div>)}

        {acceptCreditsMutation.isError && (<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Error: {acceptCreditsMutation.error instanceof Error ? acceptCreditsMutation.error.message : 'Unknown error'}
            </p>
          </div>)}

        {/* Submit Button */}
        <button type="submit" disabled={!isFormValid || acceptCreditsMutation.isPending} className={"w-full py-3 px-4 rounded-lg font-medium transition-colors ".concat(isFormValid && !acceptCreditsMutation.isPending
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>
          {acceptCreditsMutation.isPending ? (<>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Processing...
            </>) : ('Accept Credits')}
        </button>
      </form>
    </div>);
};
export default RestaurantCreditRedemptionForm;

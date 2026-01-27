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
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertCircle, Heart, MapPin, MessageSquare } from 'lucide-react';
import { apiUrl } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
export default function EmptyCountyExperience(_a) {
    var _this = this;
    var county = _a.county, state = _a.state;
    var _b = useState(false), submitDialog = _b[0], setSubmitDialog = _b[1];
    var _c = useState({
        restaurantName: '',
        address: '',
        website: '',
        phoneNumber: '',
        category: '',
        description: '',
    }), formData = _c[0], setFormData = _c[1];
    var metrics = useQuery({
        queryKey: ['county-metrics', county, state],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/affiliate/county/empty-check?county=".concat(county, "&state=").concat(state))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }).data;
    var submitMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(apiUrl('/api/affiliate/submit-restaurant'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(__assign(__assign({}, data), { county: county, state: state })),
                            credentials: 'include',
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('Failed to submit');
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
        onSuccess: function () {
            setSubmitDialog(false);
            setFormData({
                restaurantName: '',
                address: '',
                website: '',
                phoneNumber: '',
                category: '',
                description: '',
            });
        },
    });
    if (!(metrics === null || metrics === void 0 ? void 0 : metrics.isEmpty)) {
        return null; // County has content
    }
    return (<div className="space-y-6">
      {/* Step 1: Professional Acknowledgement */}
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1"/>
            <div>
              <CardTitle className="text-lg">No MealScout Partners Yet</CardTitle>
              <CardDescription className="mt-2">
                We haven't partnered with restaurants in {county}, {state} yet.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 2: Early Backer Reframe */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1"/>
            <div>
              <CardTitle className="text-lg">You're Early</CardTitle>
              <CardDescription className="mt-2">
                MealScout is just starting in your area. Shape your local food scene —{' '}
                <span className="font-semibold text-blue-700">earn money doing it</span>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 3: Community Contribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5"/>
            Help Us Find Great Local Spots
          </CardTitle>
          <CardDescription>
            Know a great restaurant in {county}? Recommend it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">💰 Get Paid for Recommendations</h4>
            <p className="text-sm text-green-800">
              If a restaurant you recommend joins MealScout as a paid partner, you'll earn
              recurring commissions every month they stay active.
            </p>
          </div>

          <Button size="lg" className="w-full" onClick={function () { return setSubmitDialog(true); }}>
            <MessageSquare className="w-4 h-4 mr-2"/>
            Recommend a Restaurant
          </Button>
        </CardContent>
      </Card>

      {/* Step 4: Fallback Content (Nearby/State/National) */}
      <Card>
        <CardHeader>
          <CardTitle>Great Deals Nearby</CardTitle>
          <CardDescription>
            While we build partnerships locally, here are popular deals from around the state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Featured national offers coming soon...
          </p>
        </CardContent>
      </Card>

      {/* Submission Dialog */}
      <Dialog open={submitDialog} onOpenChange={setSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recommend a Restaurant</DialogTitle>
            <DialogDescription>
              Help us discover great local spots in {county}, {state}. If they join MealScout,
              you'll earn recurring commissions!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Restaurant Name *</label>
                <input type="text" value={formData.restaurantName} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { restaurantName: e.target.value }));
        }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1" placeholder="e.g., Joe's Pizza"/>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select value={formData.category} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { category: e.target.value }));
        }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1">
                  <option value="">Select category</option>
                  <option value="pizza">Pizza</option>
                  <option value="burger">Burger</option>
                  <option value="sushi">Sushi</option>
                  <option value="chinese">Chinese</option>
                  <option value="mexican">Mexican</option>
                  <option value="italian">Italian</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <input type="text" value={formData.address} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { address: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1" placeholder="123 Main St"/>
              </div>

              <div>
                <label className="text-sm font-medium">Website</label>
                <input type="url" value={formData.website} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { website: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1" placeholder="https://..."/>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Phone</label>
                <input type="tel" value={formData.phoneNumber} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { phoneNumber: e.target.value }));
        }} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1" placeholder="(555) 123-4567"/>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium">Why do you love this place?</label>
                <textarea value={formData.description} onChange={function (e) {
            return setFormData(__assign(__assign({}, formData), { description: e.target.value }));
        }} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1" placeholder="Tell us what makes this restaurant special..."/>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={function () { return setSubmitDialog(false); }}>
                Cancel
              </Button>
              <Button onClick={function () {
            return submitMutation.mutate(formData);
        }} disabled={!formData.restaurantName || submitMutation.isPending}>
                Submit Recommendation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}

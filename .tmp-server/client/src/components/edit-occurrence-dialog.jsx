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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
export function EditOccurrenceDialog(_a) {
    var _this = this;
    var event = _a.event, seriesName = _a.seriesName, open = _a.open, onOpenChange = _a.onOpenChange, onEventUpdated = _a.onEventUpdated;
    var _b = useState(""), startTime = _b[0], setStartTime = _b[1];
    var _c = useState(""), endTime = _c[0], setEndTime = _c[1];
    var _d = useState(1), maxTrucks = _d[0], setMaxTrucks = _d[1];
    var _e = useState(false), hardCapEnabled = _e[0], setHardCapEnabled = _e[1];
    var _f = useState(""), error = _f[0], setError = _f[1];
    var _g = useState(false), isSubmitting = _g[0], setIsSubmitting = _g[1];
    // Initialize form when event changes
    useEffect(function () {
        if (event) {
            setStartTime(event.startTime);
            setEndTime(event.endTime);
            setMaxTrucks(event.maxTrucks);
            setHardCapEnabled(event.hardCapEnabled || false);
            setError("");
        }
    }, [event]);
    var handleSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!event)
                        return [2 /*return*/];
                    setError("");
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/hosts/events/".concat(event.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                startTime: startTime,
                                endTime: endTime,
                                maxTrucks: maxTrucks,
                                hardCapEnabled: hardCapEnabled,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to update event");
                case 4:
                    onOpenChange(false);
                    onEventUpdated();
                    return [3 /*break*/, 7];
                case 5:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 7];
                case 6:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (!event)
        return null;
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event Details</DialogTitle>
          <DialogDescription>
            Update time window, capacity, or enforcement for this specific occurrence.
          </DialogDescription>
        </DialogHeader>

        {error && (<Alert variant="destructive">
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>)}

        {seriesName && (<Alert>
            <Calendar className="h-4 w-4"/>
            <AlertTitle>Part of Series: {seriesName}</AlertTitle>
            <AlertDescription>
              Changes apply to <strong>{format(new Date(event.date), "MMMM d, yyyy")}</strong> only.
              Other occurrences in this series are not affected.
            </AlertDescription>
          </Alert>)}

        <div className="space-y-4">
          <div className="bg-slate-50 border rounded-md p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4"/>
              <span className="font-medium">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input id="edit-start-time" type="time" value={startTime} onChange={function (e) { return setStartTime(e.target.value); }} required/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input id="edit-end-time" type="time" value={endTime} onChange={function (e) { return setEndTime(e.target.value); }} required/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-trucks">Max Trucks</Label>
              <Input id="edit-max-trucks" type="number" min="1" max="20" value={maxTrucks} onChange={function (e) { return setMaxTrucks(Number(e.target.value)); }} required/>
            </div>
          </div>

          <div className="flex items-center space-x-4 border p-4 rounded-md border-slate-200 bg-slate-50">
            <Switch id="edit-hard-cap" checked={hardCapEnabled} onCheckedChange={setHardCapEnabled}/>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-hard-cap" className="font-semibold">
                  Capacity Guard v2.2
                </Label>
                <Badge variant="secondary" className="text-xs">This Occurrence</Badge>
              </div>
              <p className="text-sm text-slate-500">
                Strictly enforces capacity limit for this date. Once full, no further approvals allowed.
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4"/>
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>This override applies only to this occurrence.</li>
                {seriesName && <li>Other dates in "{seriesName}" keep their original settings.</li>}
                <li>If capacity is reduced, existing accepted trucks are not automatically removed.</li>
                <li>Capacity Guard enforcement applies immediately after save.</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={function () { return onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}

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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
export function CreateSeriesDialog(_a) {
    var _this = this;
    var open = _a.open, onOpenChange = _a.onOpenChange, onSeriesCreated = _a.onSeriesCreated;
    var _b = useState("draft"), step = _b[0], setStep = _b[1];
    var _c = useState(null), seriesId = _c[0], setSeriesId = _c[1];
    // Draft form state
    var _d = useState(""), name = _d[0], setName = _d[1];
    var _e = useState(""), description = _e[0], setDescription = _e[1];
    var _f = useState("America/New_York"), timezone = _f[0], setTimezone = _f[1];
    var _g = useState(""), startDate = _g[0], setStartDate = _g[1];
    var _h = useState(""), endDate = _h[0], setEndDate = _h[1];
    var _j = useState("weekly"), recurrenceType = _j[0], setRecurrenceType = _j[1];
    var _k = useState([]), selectedDays = _k[0], setSelectedDays = _k[1];
    var _l = useState(""), defaultStartTime = _l[0], setDefaultStartTime = _l[1];
    var _m = useState(""), defaultEndTime = _m[0], setDefaultEndTime = _m[1];
    var _o = useState(1), defaultMaxTrucks = _o[0], setDefaultMaxTrucks = _o[1];
    var _p = useState(false), defaultHardCapEnabled = _p[0], setDefaultHardCapEnabled = _p[1];
    var _q = useState([]), previewOccurrences = _q[0], setPreviewOccurrences = _q[1];
    var _r = useState(""), error = _r[0], setError = _r[1];
    var _s = useState(false), isSubmitting = _s[0], setIsSubmitting = _s[1];
    var _t = useState(false), showPublishConfirm = _t[0], setShowPublishConfirm = _t[1];
    var dayOptions = [
        { value: "MO", label: "Monday" },
        { value: "TU", label: "Tuesday" },
        { value: "WE", label: "Wednesday" },
        { value: "TH", label: "Thursday" },
        { value: "FR", label: "Friday" },
        { value: "SA", label: "Saturday" },
        { value: "SU", label: "Sunday" },
    ];
    var toggleDay = function (day) {
        setSelectedDays(function (prev) {
            return prev.includes(day) ? prev.filter(function (d) { return d !== day; }) : __spreadArray(__spreadArray([], prev, true), [day], false);
        });
    };
    var handleCreateDraft = function () { return __awaiter(_this, void 0, void 0, function () {
        var recurrenceRule, res, data, series, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError("");
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    recurrenceRule = recurrenceType === "weekly" && selectedDays.length > 0
                        ? "WEEKLY:".concat(selectedDays.join(","))
                        : null;
                    return [4 /*yield*/, fetch("/api/hosts/event-series", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: name,
                                description: description,
                                timezone: timezone,
                                startDate: new Date(startDate).toISOString(),
                                endDate: new Date(endDate).toISOString(),
                                recurrenceRule: recurrenceRule,
                                defaultStartTime: defaultStartTime,
                                defaultEndTime: defaultEndTime,
                                defaultMaxTrucks: defaultMaxTrucks,
                                defaultHardCapEnabled: defaultHardCapEnabled,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to create series");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    series = _a.sent();
                    setSeriesId(series.id);
                    // Generate preview
                    generatePreview(series);
                    setStep("preview");
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 8];
                case 7:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var generatePreview = function (series) {
        // Client-side preview generation (mirrors server logic)
        var occurrences = [];
        var start = new Date(series.startDate);
        var end = new Date(series.endDate);
        if (series.recurrenceRule && series.recurrenceRule.startsWith("WEEKLY:")) {
            var daysStr = series.recurrenceRule.split(":")[1];
            var dayMap_1 = {
                SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
            };
            var days = daysStr.split(",").map(function (d) { return dayMap_1[d]; }).filter(function (d) { return d !== undefined; });
            var currentDate = new Date(start);
            while (currentDate <= end) {
                if (days.includes(currentDate.getDay())) {
                    occurrences.push({
                        date: new Date(currentDate),
                        startTime: series.defaultStartTime,
                        endTime: series.defaultEndTime,
                        maxTrucks: series.defaultMaxTrucks,
                        hardCapEnabled: series.defaultHardCapEnabled,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        else {
            occurrences.push({
                date: start,
                startTime: series.defaultStartTime,
                endTime: series.defaultEndTime,
                maxTrucks: series.defaultMaxTrucks,
                hardCapEnabled: series.defaultHardCapEnabled,
            });
        }
        setPreviewOccurrences(occurrences.slice(0, 50)); // Limit preview to 50
    };
    var handlePublish = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!seriesId)
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    setError("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/hosts/event-series/".concat(seriesId, "/publish"), {
                            method: "POST",
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to publish series");
                case 4:
                    setShowPublishConfirm(false);
                    onOpenChange(false);
                    onSeriesCreated();
                    resetForm();
                    return [3 /*break*/, 7];
                case 5:
                    err_2 = _a.sent();
                    setError(err_2.message);
                    return [3 /*break*/, 7];
                case 6:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var resetForm = function () {
        setStep("draft");
        setSeriesId(null);
        setName("");
        setDescription("");
        setTimezone("America/New_York");
        setStartDate("");
        setEndDate("");
        setRecurrenceType("weekly");
        setSelectedDays([]);
        setDefaultStartTime("");
        setDefaultEndTime("");
        setDefaultMaxTrucks(1);
        setDefaultHardCapEnabled(false);
        setPreviewOccurrences([]);
        setError("");
    };
    return (<>
      <Dialog open={open} onOpenChange={function (isOpen) {
            onOpenChange(isOpen);
            if (!isOpen)
                resetForm();
        }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "draft" && "Create Open Call (Series)"}
              {step === "preview" && "Preview Generated Occurrences"}
            </DialogTitle>
            <DialogDescription>
              {step === "draft" && "Create a multi-day or recurring event series for festivals, markets, or regular gatherings."}
              {step === "preview" && "Review the occurrences that will be generated. Once published, trucks can express interest in individual dates."}
            </DialogDescription>
          </DialogHeader>

          {error && (<Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>)}

          {step === "draft" && (<div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="series-name">Series Name</Label>
                <Input id="series-name" placeholder="e.g., Summer Market 2026" value={name} onChange={function (e) { return setName(e.target.value); }} required/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="series-description">Description (Optional)</Label>
                <Input id="series-description" placeholder="Brief description of the series" value={description} onChange={function (e) { return setDescription(e.target.value); }}/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">All occurrences will use this timezone. Cannot be changed after creation.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={function (e) { return setStartDate(e.target.value); }} min={new Date().toISOString().split("T")[0]} required/>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={function (e) { return setEndDate(e.target.value); }} min={startDate || new Date().toISOString().split("T")[0]} required/>
                  <p className="text-xs text-slate-500">Maximum 180 days from start date</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Recurrence Pattern</Label>
                <Select value={recurrenceType} onValueChange={function (v) { return setRecurrenceType(v); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly (Select Days)</SelectItem>
                    <SelectItem value="none">None (Single Occurrence)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType === "weekly" && (<div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map(function (day) { return (<Button key={day.value} type="button" variant={selectedDays.includes(day.value) ? "default" : "outline"} size="sm" onClick={function () { return toggleDay(day.value); }}>
                        {selectedDays.includes(day.value) && <Check className="mr-1 h-3 w-3"/>}
                        {day.label}
                      </Button>); })}
                  </div>
                </div>)}

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Occurrence Defaults</h3>
                <p className="text-sm text-slate-500">These settings will be applied to all generated occurrences.</p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-start-time">Start Time</Label>
                    <Input id="default-start-time" type="time" value={defaultStartTime} onChange={function (e) { return setDefaultStartTime(e.target.value); }} required/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-end-time">End Time</Label>
                    <Input id="default-end-time" type="time" value={defaultEndTime} onChange={function (e) { return setDefaultEndTime(e.target.value); }} required/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-max-trucks">Max Trucks</Label>
                    <Input id="default-max-trucks" type="number" min="1" max="20" value={defaultMaxTrucks} onChange={function (e) { return setDefaultMaxTrucks(Number(e.target.value)); }} required/>
                  </div>
                </div>

                <div className="flex items-center space-x-4 border p-4 rounded-md border-slate-200 bg-slate-50">
                  <Switch id="default-hard-cap" checked={defaultHardCapEnabled} onCheckedChange={setDefaultHardCapEnabled}/>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="default-hard-cap" className="font-semibold">Capacity Guard v2.2</Label>
                      <Badge variant="secondary" className="text-xs">Per Occurrence</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Strictly enforces capacity limits on each occurrence. Trucks cannot be accepted once the limit is reached.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Series will be saved as a draft. Nothing is discoverable until you publish.</li>
                    <li>Trucks express interest per occurrence (individual dates), not the series as a whole.</li>
                    <li>Capacity Guard and acceptance decisions apply per occurrence.</li>
                    <li>No payments or booking guarantees. This is an interest-only system.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>)}

          {step === "preview" && (<div className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4"/>
                <AlertTitle>Generated Occurrences</AlertTitle>
                <AlertDescription>
                  {previewOccurrences.length} occurrence{previewOccurrences.length !== 1 ? "s" : ""} will be created.
                  {previewOccurrences.length > 50 && " (Showing first 50)"}
                </AlertDescription>
              </Alert>

              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-4">
                {previewOccurrences.map(function (occ, idx) { return (<div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-md text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500"/>
                      <span className="font-medium">{format(occ.date, "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                      <span>{occ.startTime} - {occ.endTime}</span>
                      <span>{occ.maxTrucks} trucks</span>
                      {occ.hardCapEnabled && (<Badge variant="secondary" className="text-xs">Strict Cap</Badge>)}
                    </div>
                  </div>); })}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Before Publishing</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Once published, trucks can discover and express interest in individual occurrences.</li>
                    <li>You'll manage interests and acceptances per occurrence through your dashboard.</li>
                    <li>Edits to defaults won't change already-generated occurrences.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>)}

          <DialogFooter>
            {step === "draft" && (<>
                <Button variant="outline" onClick={function () { return onOpenChange(false); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDraft} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Preview Occurrences"}
                </Button>
              </>)}
            {step === "preview" && (<>
                <Button variant="outline" onClick={function () { return setStep("draft"); }}>
                  Back to Edit
                </Button>
                <Button onClick={function () { return setShowPublishConfirm(true); }} disabled={isSubmitting}>
                  Publish Series
                </Button>
              </>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Series?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make all {previewOccurrences.length} occurrence{previewOccurrences.length !== 1 ? "s" : ""} discoverable to trucks.
              Trucks can then express interest in individual dates. You'll manage each occurrence separately from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}

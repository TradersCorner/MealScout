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
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
export function CancelSeriesDialog(_a) {
    var _this = this;
    var open = _a.open, onOpenChange = _a.onOpenChange, seriesId = _a.seriesId, seriesName = _a.seriesName, futureOccurrencesCount = _a.futureOccurrencesCount, affectedTrucksCount = _a.affectedTrucksCount;
    var _b = useState(false), isConfirmed = _b[0], setIsConfirmed = _b[1];
    var queryClient = useQueryClient();
    var cancelSeriesMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/hosts/event-series/".concat(seriesId, "/cancel"), {
                            method: "POST",
                            credentials: "include",
                        })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        error = _a.sent();
                        throw new Error(error.error || "Failed to cancel series");
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            queryClient.invalidateQueries({ queryKey: ["event-series"] });
            queryClient.invalidateQueries({ queryKey: ["host-events"] });
            // Reset state and close dialog
            setIsConfirmed(false);
            onOpenChange(false);
            // Show success feedback
            alert("Series cancelled successfully!\n\n" +
                "\u2022 ".concat(data.futureOccurrencesCancelled, " future occurrence(s) cancelled\n") +
                "\u2022 ".concat(data.trucksNotified, " truck(s) notified by email"));
        },
        onError: function (error) {
            alert("Error: ".concat(error.message));
        },
    });
    var handleCancel = function () {
        if (!isConfirmed) {
            alert("Please confirm by checking the box before cancelling.");
            return;
        }
        cancelSeriesMutation.mutate();
    };
    var handleClose = function () {
        if (!cancelSeriesMutation.isPending) {
            setIsConfirmed(false);
            onOpenChange(false);
        }
    };
    return (<Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5"/>
            Cancel Event Series
          </DialogTitle>
          <DialogDescription>
            This action will cancel all future occurrences of this series. Past events will not be affected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-semibold text-red-900 mb-2">{seriesName}</h4>
            <div className="space-y-1 text-sm text-red-800">
              <p>
                <strong>{futureOccurrencesCount}</strong> future occurrence{futureOccurrencesCount !== 1 ? "s" : ""} will be cancelled
              </p>
              <p>
                <strong>{affectedTrucksCount}</strong> truck{affectedTrucksCount !== 1 ? "s" : ""} will be notified by email
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> This action cannot be undone. All interested and accepted trucks will be notified automatically.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={isConfirmed} onChange={function (e) { return setIsConfirmed(e.target.checked); }} className="mt-1 h-4 w-4 rounded border-gray-300" disabled={cancelSeriesMutation.isPending}/>
            <span className="text-sm text-gray-700">
              I understand that cancelling this series will remove all future occurrences and notify all affected trucks. This action cannot be reversed.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={cancelSeriesMutation.isPending}>
            Keep Series
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={!isConfirmed || cancelSeriesMutation.isPending}>
            {cancelSeriesMutation.isPending ? "Cancelling..." : "Cancel Series"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}

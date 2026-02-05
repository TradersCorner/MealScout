import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type ParkingScheduleItem = {
  id: string;
  date: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  cleanupEndTime?: string | null;
  title: string;
  subtitle?: string | null;
  type: "booking" | "manual" | "accepted_interest";
  slotLabel?: string | null;
  isPublic?: boolean | null;
  manualId?: string;
  bookingId?: string;
  hostId?: string;
  locationName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  reportKey?: string;
};

type ParkingScheduleCalendarProps = {
  items: ParkingScheduleItem[];
  title?: string;
  subtitle?: string;
  allowManualEdits?: boolean;
  onDeleteManual?: (manualId: string) => void;
  reportLookup?: Record<string, boolean>;
  onAddReport?: (item: ParkingScheduleItem) => void;
  className?: string;
};

const typeBadgeStyles: Record<ParkingScheduleItem["type"], string> = {
  booking: "bg-orange-100 text-orange-800 border-orange-200",
  manual: "bg-slate-100 text-slate-700 border-slate-200",
  accepted_interest: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const typeDotStyles: Record<ParkingScheduleItem["type"], string> = {
  booking: "bg-orange-500",
  manual: "bg-slate-400",
  accepted_interest: "bg-indigo-500",
};

const toDate = (value: string | Date) =>
  value instanceof Date ? value : parseISO(value);

const toDateKey = (value: string | Date) => format(toDate(value), "yyyy-MM-dd");

export function ParkingScheduleCalendar({
  items,
  title = "Parking Schedule",
  subtitle = "Auto-updated by Parking Pass bookings. Add manual stops anytime.",
  allowManualEdits = false,
  onDeleteManual,
  reportLookup,
  onAddReport,
  className,
}: ParkingScheduleCalendarProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [activeDate, setActiveDate] = useState(() => new Date());

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ParkingScheduleItem[]>();
    items.forEach((item) => {
      const key = toDateKey(item.date);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    for (const list of map.values()) {
      list.sort((a, b) => {
        const timeA = a.startTime || "";
        const timeB = b.startTime || "";
        return timeA.localeCompare(timeB);
      });
    }
    return map;
  }, [items]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let day = start; day <= end; day = addDays(day, 1)) {
      days.push(day);
    }
    return days;
  }, [monthAnchor]);

  const activeKey = toDateKey(activeDate);
  const activeItems = itemsByDate.get(activeKey) ?? [];
  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  return (
    <div className={className}>
      <div className="parking-schedule-calendar rounded-2xl pp-glass overflow-hidden">
        <div className="pp-calendar-header flex flex-col gap-2 border-b border-[color:var(--border-subtle)] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-slate-700">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthAnchor((current) => addMonths(current, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center text-sm font-semibold text-gray-900">
                {format(monthAnchor, "MMMM yyyy")}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonthAnchor((current) => addMonths(current, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[11px] text-slate-600">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label} className="text-center uppercase tracking-wide">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 p-4">
          {calendarDays.map((day) => {
            const key = toDateKey(day);
            const dayItems = itemsByDate.get(key) ?? [];
            const isCurrentMonth = isSameMonth(day, monthAnchor);
            const isActive = isSameDay(day, activeDate);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveDate(day)}
                className={`pp-calendar-day min-h-[84px] rounded-xl border px-2 py-2 text-left transition ${
                  isActive ? "pp-calendar-day--active" : "pp-calendar-day--idle"
                } ${isCurrentMonth ? "pp-calendar-day--in-month" : "pp-calendar-day--out-month"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isToday(day) ? "text-orange-600" : "text-inherit"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-[10px] text-slate-500">
                      {dayItems.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 text-[10px] text-slate-700"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          typeDotStyles[item.type]
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <span className="text-[10px] text-slate-500">
                      +{dayItems.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="mt-4 rounded-2xl pp-glass">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {format(activeDate, "EEEE, MMM d")}
              </p>
              <p className="text-xs text-gray-500">
                {activeItems.length
                  ? `${activeItems.length} stop${
                      activeItems.length === 1 ? "" : "s"
                    } scheduled`
                  : "No stops scheduled"}
              </p>
            </div>
          </div>

          {activeItems.length > 0 ? (
            <div className="mt-4 space-y-3">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl pp-glass-muted p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${typeBadgeStyles[item.type]}`}
                        >
                          {item.type === "booking"
                            ? "Parking Pass"
                            : item.type === "manual"
                              ? "Manual"
                              : "Accepted"}
                        </Badge>
                        {item.isPublic === false && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-200 text-slate-500"
                          >
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-600">
                        {item.startTime && item.endTime
                          ? `${item.startTime} - ${item.endTime}`
                          : "Time not set"}
                        {item.cleanupEndTime
                          ? ` • Cleanup until ${item.cleanupEndTime}`
                          : ""}
                        {item.slotLabel ? ` • ${item.slotLabel}` : ""}
                      </p>
                    </div>
                    {allowManualEdits &&
                      item.type === "manual" &&
                      item.manualId &&
                      onDeleteManual && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteManual(item.manualId!)}
                        >
                          Remove
                        </Button>
                      )}
                    {onAddReport && item.reportKey && (
                      <div className="flex items-center gap-2">
                        {reportLookup?.[item.reportKey] && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-200 text-emerald-700"
                          >
                            Report saved
                          </Badge>
                        )}
                        {(isSameDay(toDate(item.date), today) ||
                          isBefore(toDate(item.date), today)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAddReport(item)}
                          >
                            {reportLookup?.[item.reportKey]
                              ? "Edit report"
                              : "Add day report"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
              Choose another day to see scheduled stops.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

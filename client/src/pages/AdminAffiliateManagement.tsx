import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AffiliateUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userType: string | null;
  affiliateTag: string | null;
  affiliatePercent: number | null;
  affiliateCloserUserId: string | null;
  affiliateBookerUserId: string | null;
  linksShared: number;
  peopleReferred: number;
  paidReferrals: number;
  affiliateEarningsCents: number;
  mealScoutRevenueCents: number;
  subscriptionRevenueCents: number;
  bookingRevenueCents: number;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);

export default function AdminAffiliateManagement() {
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState("all");
  const [editing, setEditing] = useState<AffiliateUser | null>(null);
  const [percent, setPercent] = useState("");
  const [closerId, setCloserId] = useState("");
  const [bookerId, setBookerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: users = [], refetch } = useQuery<AffiliateUser[]>({
    queryKey: ["admin-affiliates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/affiliates/users");
      if (!res.ok) throw new Error("Failed to fetch affiliate users");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesType =
        userType === "all" ? true : user.userType === userType;
      const label = `${user.firstName || ""} ${user.lastName || ""} ${
        user.email || ""
      } ${user.affiliateTag || ""}`.toLowerCase();
      const matchesSearch = term.length === 0 || label.includes(term);
      return matchesType && matchesSearch;
    });
  }, [users, search, userType]);

  const startEdit = (user: AffiliateUser) => {
    setEditing(user);
    setPercent(String(user.affiliatePercent ?? 5));
    setCloserId(user.affiliateCloserUserId || "");
    setBookerId(user.affiliateBookerUserId || "");
    setError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliatePercent: Number(percent),
          affiliateCloserUserId: closerId || null,
          affiliateBookerUserId: bookerId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update affiliate settings");
      }
      await refetch();
      setEditing(null);
    } catch (err: any) {
      setError(err.message || "Failed to update affiliate settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, tag..."
              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All user types</option>
            <option value="customer">Customer</option>
            <option value="restaurant_owner">Restaurant</option>
            <option value="food_truck">Food Truck</option>
            <option value="host">Host</option>
            <option value="event_coordinator">Event Coordinator</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Percent</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Subs / Bookings</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName || "Unnamed"} {user.lastName || ""}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email || "No email"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs uppercase text-gray-600">
                      {user.userType || "unknown"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.affiliateTag || "userXXXX"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.affiliatePercent ?? 5}%
                    </TableCell>
                    <TableCell>{user.linksShared}</TableCell>
                    <TableCell>{user.peopleReferred}</TableCell>
                    <TableCell>{user.paidReferrals}</TableCell>
                    <TableCell>{formatCurrency(user.mealScoutRevenueCents)}</TableCell>
                    <TableCell>{formatCurrency(user.affiliateEarningsCents)}</TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(user.subscriptionRevenueCents)} /{" "}
                        {formatCurrency(user.bookingRevenueCents)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(user)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-gray-500">
                      No matching users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Affiliate Settings</DialogTitle>
            <DialogDescription>
              Update commission percent and override booker/closer attribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Commission Percent</label>
              <input
                type="number"
                min="0"
                max="100"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Closer User ID</label>
              <input
                type="text"
                value={closerId}
                onChange={(e) => setCloserId(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Booker User ID</label>
              <input
                type="text"
                value={bookerId}
                onChange={(e) => setBookerId(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

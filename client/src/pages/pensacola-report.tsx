import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PensacolaReport() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(apiUrl("/api/public/pensacola/report/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Request failed (status=${res.status})`);
      }
      setStatus("sent");
      setMessage(
        "Check your email for the PDF download link. (If you don’t see it, check spam/promotions.)",
      );
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Unable to send report right now.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">
          Pensacola Food Truck Report
        </h1>
        <p className="text-muted-foreground mt-2">
          Download a high-level PDF of profitable parking types and neighborhoods in Pensacola.
          (No exact addresses in the report.)
        </p>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Get the PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">First name (optional)</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Taylor"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">Email</label>
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@truck.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  <Button type="submit" disabled={status === "submitting"}>
                    {status === "submitting" ? "Sending…" : "Email me the report"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/pensacola/spots">See spots instead</a>
                  </Button>
                </div>

                {message ? (
                  <div
                    className={
                      status === "error"
                        ? "text-sm text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {message}
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


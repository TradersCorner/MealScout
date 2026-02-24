import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-layered)] px-4 sm:px-6 py-12">
      <div className="max-w-xl mx-auto">
        <Card className="bg-[var(--bg-card)] border-[color:var(--border-subtle)] shadow-clean-lg">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
              System Check
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
              Service Status
            </h1>
            <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mx-auto">
              Need help or seeing something off? Contact support and we will
              follow up quickly.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/contact">
                <Button className="rounded-lg">Contact Support</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="rounded-lg">
                  Return Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

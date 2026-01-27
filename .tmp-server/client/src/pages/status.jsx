import { Link } from "wouter";
import { Button } from "@/components/ui/button";
export default function StatusPage() {
    return (<div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-6 py-12">
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Service Status</h1>
        <p className="text-gray-700">
          Need help or seeing something off? Contact support and we will follow up
          quickly.
        </p>
        <Link href="/contact">
          <Button>Contact Support</Button>
        </Link>
      </div>
    </div>);
}

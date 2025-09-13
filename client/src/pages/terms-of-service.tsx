import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, Shield } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last updated: [DATE TO BE UPDATED]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Terms of Service
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Please read these Terms of Service carefully before using MealScout
            </p>
          </CardHeader>

          <CardContent className="prose prose-gray max-w-none">
            {/* Placeholder content - replace with generated Terms of Service */}
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: By accessing and using MealScout, you accept and agree to be bound by the terms and provision of this agreement.]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: MealScout is a hyper-local meal deals discovery platform that connects restaurants, bars, and food trucks with nearby customers through location-based services and real-time deal notifications.]
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Deal creation and management for businesses</li>
                  <li>Location-based deal discovery for customers</li>
                  <li>Real-time GPS tracking for food trucks</li>
                  <li>Subscription-based business model</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Subscription Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Subscription fees and billing cycles]
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Pricing Plans:</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Monthly: $49/month</li>
                    <li>• Quarterly: $100/3 months (new users only)</li>
                    <li>• Yearly: $450/year</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Prohibited uses and user responsibilities]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Location Services</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: GPS tracking consent and location data usage]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Business Verification</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Requirements for business verification and document submission]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Payment Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Payment processing via Stripe, refunds, and billing disputes]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Account termination conditions and procedures]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Liability limitations and disclaimers]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Contact details for legal inquiries]
                </p>
              </section>

            </div>

            {/* Notice Box */}
            <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Important Notice</h3>
                  <p className="text-red-800 text-sm">
                    This is a template structure. Please replace all placeholder content with your actual Terms of Service generated from TermsFeed or Termly before going live.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
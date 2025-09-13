import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Calendar, Lock } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Privacy Policy
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How DealScout collects, uses, and protects your personal information
            </p>
          </CardHeader>

          <CardContent className="prose prose-gray max-w-none">
            {/* Placeholder content - replace with generated Privacy Policy */}
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Types of information collected from users]
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Information:</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Name and email address (from account registration)</li>
                    <li>• Profile information from Google/Facebook OAuth</li>
                    <li>• Business information (for restaurant owners)</li>
                    <li>• Payment information (processed securely via Stripe)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Location Data:</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• GPS coordinates for deal discovery</li>
                    <li>• Real-time location for food truck tracking</li>
                    <li>• Address information for business verification</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Purposes for data processing and usage]
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide location-based deal recommendations</li>
                  <li>Process subscription payments and billing</li>
                  <li>Enable real-time food truck tracking</li>
                  <li>Verify business credentials and documents</li>
                  <li>Send important service communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: When and how information is shared with third parties]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Third-party integrations and their data practices]
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">We use these third-party services:</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• <strong>Google OAuth:</strong> For secure authentication</li>
                    <li>• <strong>Facebook Login:</strong> For social authentication</li>
                    <li>• <strong>Stripe:</strong> For secure payment processing</li>
                    <li>• <strong>BigDataCloud:</strong> For location geocoding services</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Security measures and data protection practices]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Location Data and GPS Tracking</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Specific practices for location data collection and usage]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: User rights under GDPR, CCPA, and other privacy laws]
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt-out of location services</li>
                  <li>Control marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: How long personal data is retained and deletion practices]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Cross-border data transfer practices and safeguards]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: COPPA compliance and children under 13]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: How privacy policy updates are handled and communicated]
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  [REPLACE WITH GENERATED CONTENT: Contact information for privacy-related inquiries]
                </p>
              </section>

            </div>

            {/* Notice Box */}
            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Important Notice</h3>
                  <p className="text-blue-800 text-sm">
                    This is a template structure. Please replace all placeholder content with your actual Privacy Policy generated from TermsFeed or Termly before going live. Ensure GDPR and CCPA compliance for EU/California users.
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
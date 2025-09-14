import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Calendar, Mail, MessageCircle } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      <BackHeader
        title="Data Deletion Instructions"
        fallbackHref="/"
        icon={Trash2}
        rightActions={
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: January 13, 2025</span>
          </div>
        }
        className="bg-white shadow-sm"
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Data Deletion Instructions
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How to request deletion of your personal data from MealScout
            </p>
          </CardHeader>

          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Account Deletion</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You can delete your MealScout account and all associated data directly from your profile settings:
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Self-Service Deletion:</h3>
                  <ol className="text-gray-700 space-y-2 text-sm">
                    <li>1. Log into your MealScout account</li>
                    <li>2. Navigate to Profile → Settings</li>
                    <li>3. Scroll to "Account Management"</li>
                    <li>4. Click "Delete Account"</li>
                    <li>5. Confirm deletion by typing your email address</li>
                  </ol>
                  <p className="text-sm text-gray-600 mt-3">
                    ⚠️ This action is permanent and cannot be undone.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Manual Deletion Request</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you're unable to access your account or prefer to request deletion manually, you can contact us directly:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Mail className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Email Request</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Send an email with your deletion request to:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = 'mailto:privacy@mealscout.com?subject=Data Deletion Request'}
                      data-testid="button-email-deletion"
                    >
                      privacy@mealscout.com
                    </Button>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Contact Form</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      Submit a deletion request through our contact form:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = '/contact?subject=data-deletion'}
                      data-testid="button-contact-deletion"
                    >
                      Contact Form
                    </Button>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Required Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To process your deletion request, please provide the following information:
                </p>
                
                <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Required Details:</h3>
                  <ul className="text-gray-700 space-y-2 text-sm">
                    <li>• Full name associated with your account</li>
                    <li>• Email address used for registration</li>
                    <li>• Phone number (if provided)</li>
                    <li>• Reason for deletion (optional but helpful)</li>
                    <li>• Any additional account identifiers you remember</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Gets Deleted</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you request account deletion, we will permanently remove:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-red-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-3">Personal Data Removed:</h3>
                    <ul className="text-red-800 space-y-1 text-sm">
                      <li>• Profile information and photos</li>
                      <li>• Email address and contact details</li>
                      <li>• Location data and preferences</li>
                      <li>• Order history and favorites</li>
                      <li>• Reviews and ratings</li>
                      <li>• Payment information</li>
                      <li>• Communication records</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Data We May Retain:</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• Anonymous usage analytics</li>
                      <li>• Financial records (tax requirements)</li>
                      <li>• Legal compliance data</li>
                      <li>• Fraud prevention records</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">
                      *Retained data is anonymized and cannot be linked back to you
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Timeline & Process</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our data deletion process follows these steps:
                </p>
                
                <div className="bg-green-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-green-900 mb-3">Deletion Timeline:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-semibold mr-3">1</div>
                      <span className="text-green-800"><strong>Immediate:</strong> Account access disabled</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-semibold mr-3">2</div>
                      <span className="text-green-800"><strong>Within 7 days:</strong> Personal data removed from active systems</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-semibold mr-3">3</div>
                      <span className="text-green-800"><strong>Within 30 days:</strong> Data purged from backups (where legally permitted)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-semibold mr-3">4</div>
                      <span className="text-green-800"><strong>Confirmation:</strong> Email notification when deletion is complete</span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Facebook Login Data</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you signed up using Facebook Login, deleting your MealScout account will:
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>• Remove all data MealScout obtained from Facebook</li>
                    <li>• Revoke MealScout's access to your Facebook account</li>
                    <li>• Delete any Facebook-sourced profile information</li>
                    <li>• Remove integration with Facebook's sharing features</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-3">
                    Note: This does not affect your Facebook account itself. To fully disconnect, also revoke MealScout's permissions in your Facebook app settings.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have questions about data deletion or need assistance with the process:
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Privacy Team</h3>
                      <p className="text-sm text-gray-700">privacy@mealscout.com</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Support Team</h3>
                      <p className="text-sm text-gray-700">support@mealscout.com</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    We typically respond to deletion requests within 1-2 business days.
                  </p>
                </div>
              </section>

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mt-8">
                <div className="flex items-center mb-2">
                  <Trash2 className="w-6 h-6 mr-2" />
                  <h3 className="text-lg font-semibold">Your Privacy Rights</h3>
                </div>
                <p className="text-sm opacity-90">
                  This page complies with GDPR, CCPA, and other privacy regulations. You have the right to request deletion of your personal data at any time. We are committed to processing these requests promptly and transparently.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
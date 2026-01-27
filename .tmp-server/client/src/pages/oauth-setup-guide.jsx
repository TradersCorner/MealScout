import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
export default function OAuthSetupGuide() {
    var baseUrl = "https://mealscout.us";
    return (<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <SEOHead title="OAuth Setup Guide - MealScout" description="Configuration guide for Google and Facebook OAuth authentication" noIndex={true}/>
      <BackHeader title="OAuth Configuration Guide" fallbackHref="/admin/dashboard" icon={Settings} className="bg-white shadow-sm"/>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Google OAuth Setup */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
              </div>
              <CardTitle className="text-2xl">Google OAuth Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2"/>
                Required Configuration
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-blue-900">1. Google Cloud Console Setup</p>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    Open Google Cloud Console <ExternalLink className="w-3 h-3"/>
                  </a>
                </div>

                <div>
                  <p className="font-medium text-blue-900">2. OAuth Consent Screen</p>
                  <ul className="list-disc list-inside text-blue-800 ml-4 space-y-1">
                    <li>User Type: External</li>
                    <li>App Name: MealScout</li>
                    <li>User Support Email: info.mealscout@gmail.com</li>
                    <li>Developer Contact: info.mealscout@gmail.com</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-blue-900">3. App Domain Settings</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <p className="text-xs text-gray-600 mb-1">Authorized Domains:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">mealscout.us</code>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">4. App Links (REQUIRED)</p>
                  <div className="space-y-2 mt-2">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Privacy Policy URL:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/privacy-policy</code>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Terms of Service URL:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/terms-of-service</code>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">5. OAuth 2.0 Client IDs</p>
                  <p className="text-blue-800 text-xs mb-2">Create "Web application" credentials with these settings:</p>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Authorized JavaScript Origins:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}</code>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Authorized Redirect URIs:</p>
                      <div className="space-y-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/api/auth/google/customer/callback</code>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/api/auth/google/restaurant/callback</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">6. Scopes</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <ul className="list-disc list-inside text-blue-800 text-xs space-y-1">
                      <li>userinfo.email</li>
                      <li>userinfo.profile</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2"/>
                Environment Variables
              </h3>
              <p className="text-yellow-800 text-sm mb-3">
                After creating OAuth credentials, add these to your Replit Secrets:
              </p>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <code className="text-xs">GOOGLE_CLIENT_ID=your_client_id_here</code>
                </div>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <code className="text-xs">GOOGLE_CLIENT_SECRET=your_client_secret_here</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facebook OAuth Setup */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <CardTitle className="text-2xl">Facebook OAuth Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2"/>
                Required Configuration
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-blue-900">1. Facebook Developers Portal</p>
                  <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    Open Facebook for Developers <ExternalLink className="w-3 h-3"/>
                  </a>
                </div>

                <div>
                  <p className="font-medium text-blue-900">2. App Basic Settings</p>
                  <div className="space-y-2 mt-2">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">App Name:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">MealScout</code>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">App Domain:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">mealscout.us</code>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">3. Privacy Policy URL (REQUIRED)</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/privacy-policy</code>
                  </div>
                  <p className="text-xs text-red-600 mt-1">⚠️ Facebook will reject your app without this URL configured</p>
                </div>

                <div>
                  <p className="font-medium text-blue-900">4. User Data Deletion URL (REQUIRED)</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/data-deletion</code>
                  </div>
                  <p className="text-xs text-red-600 mt-1">⚠️ Required for Facebook Platform Policy compliance</p>
                </div>

                <div>
                  <p className="font-medium text-blue-900">5. Terms of Service URL</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/terms-of-service</code>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">6. Facebook Login Settings</p>
                  <p className="text-blue-800 text-xs mb-2">Navigate to Products → Facebook Login → Settings</p>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Valid OAuth Redirect URIs:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{baseUrl}/api/auth/facebook/callback</code>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">7. Permissions & Features</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <p className="text-xs text-gray-600 mb-1">Required Permissions:</p>
                    <ul className="list-disc list-inside text-blue-800 text-xs space-y-1">
                      <li>email (Standard Access - no review needed)</li>
                      <li>public_profile (Default - always available)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-blue-900">8. App Mode</p>
                  <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                    <p className="text-xs text-blue-800 mb-2">Switch from Development to Live mode:</p>
                    <ul className="list-disc list-inside text-blue-800 text-xs space-y-1">
                      <li>Ensure all required URLs are configured</li>
                      <li>Complete Data Use Checkup</li>
                      <li>Toggle the switch at the top of the dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2"/>
                Common Facebook Errors
              </h3>
              <div className="space-y-2 text-sm text-red-800">
                <div>
                  <p className="font-medium">Error: "Privacy Policy URL is required"</p>
                  <p className="text-xs">Solution: Add {baseUrl}/privacy-policy in App Settings → Basic → Privacy Policy URL</p>
                </div>
                <div>
                  <p className="font-medium">Error: "User Data Deletion Callback URL"</p>
                  <p className="text-xs">Solution: Add {baseUrl}/data-deletion in App Settings → Basic → User Data Deletion</p>
                </div>
                <div>
                  <p className="font-medium">Error: "Can't Load URL"</p>
                  <p className="text-xs">Solution: Ensure all URLs use HTTPS and are publicly accessible</p>
                </div>
                <div>
                  <p className="font-medium">Error: "OAuth Redirect URI Mismatch"</p>
                  <p className="text-xs">Solution: Add exact callback URL in Facebook Login → Settings → Valid OAuth Redirect URIs</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2"/>
                Environment Variables
              </h3>
              <p className="text-yellow-800 text-sm mb-3">
                After creating your Facebook app, add these to your Replit Secrets:
              </p>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <code className="text-xs">FACEBOOK_APP_ID=your_app_id_here</code>
                </div>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <code className="text-xs">FACEBOOK_APP_SECRET=your_app_secret_here</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Testing OAuth Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Verification Checklist</h3>
              <div className="space-y-2 text-sm text-green-800">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded"/>
                  <span>All privacy policy and terms URLs are accessible via HTTPS</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded"/>
                  <span>OAuth redirect URIs match exactly (including trailing slashes)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded"/>
                  <span>Environment variables are set in Replit Secrets</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded"/>
                  <span>Facebook app is in Live mode (not Development)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded"/>
                  <span>Google OAuth consent screen is configured</span>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={function () { return window.open(baseUrl + '/privacy-policy', '_blank'); }} className="w-full">
                Test Privacy Policy
              </Button>
              <Button variant="outline" onClick={function () { return window.open(baseUrl + '/data-deletion', '_blank'); }} className="w-full">
                Test Data Deletion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}

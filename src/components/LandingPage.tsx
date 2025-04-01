import { Link } from 'react-router-dom';
import { ArrowRight, Star, MessageSquare, Users, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-800">LightSMS</h1>
          </div>
          <nav className="flex space-x-4">
            <Link to="/features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Pricing
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Log in
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-800 hover:bg-blue-700">Sign up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Build Healthy Relationships with Your Mind.
              </h2>
              <p className="mt-6 text-lg text-gray-500">
                Connect with your audience through powerful SMS messaging. Reach customers instantly with our reliable bulk SMS platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button className="bg-blue-800 hover:bg-blue-700 px-6 py-3 text-base">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" className="px-6 py-3 text-base">
                    Learn more
                  </Button>
                </Link>
              </div>
              <div className="mt-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-xl font-bold text-blue-800">4.9</span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">App Store</p>
                  </div>
                  <div className="ml-8 flex-shrink-0">
                    <span className="text-xl font-bold text-blue-800">4.8</span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">Google Play</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl transform -rotate-6 scale-105 opacity-20 blur-xl"></div>
                <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="p-4 bg-blue-800 text-white">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Send SMS to Multiple Recipients</h3>
                      <p className="text-xs text-gray-500 mt-1">Reach your entire audience with just a few clicks</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Track Delivery Status</h3>
                      <p className="text-xs text-gray-500 mt-1">Know exactly when your messages are delivered</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900">Simple Pricing</h3>
                      <p className="text-xs text-gray-500 mt-1">$10/month for unlimited access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Powerful SMS Features</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to connect with your audience through SMS messaging
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-blue-800 mb-2" />
                <CardTitle>Bulk Messaging</CardTitle>
                <CardDescription>
                  Send personalized messages to thousands of recipients at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    CSV upload support
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Message templates
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Scheduled delivery
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-800 mb-2" />
                <CardTitle>Contact Management</CardTitle>
                <CardDescription>
                  Organize your contacts into groups for targeted messaging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Contact groups
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Import/export contacts
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Contact history
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-800 mb-2" />
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Track delivery rates and engagement with detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Delivery tracking
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Campaign performance
                  </li>
                  <li className="flex items-center">
                  <svg className="h-4 w-4 text-blue-800 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    Exportable reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Choose the plan that's right for your business
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="w-full border-2 border-gray-200 flex flex-col">
              <CardHeader className="text-center bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-xl font-bold text-gray-900">Basic</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$10</span>
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Perfect for individuals and small businesses just getting started with SMS marketing.
                </p>
              </CardHeader>
              <CardContent className="pt-6 flex-grow">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">1000 SMS credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Contact management</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Basic templates</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="w-full bg-blue-800 hover:bg-blue-700 py-4">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="w-full border-2 border-blue-800 flex flex-col transform scale-105 shadow-xl z-10">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-800 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="text-center bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-xl font-bold text-gray-900">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$20</span>
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Ideal for growing businesses with regular SMS marketing campaigns.
                </p>
              </CardHeader>
              <CardContent className="pt-6 flex-grow">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">2000 SMS credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Campaign scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">AI copywriting (100 prompts)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Priority support</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="w-full bg-blue-800 hover:bg-blue-700 py-4">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="w-full border-2 border-gray-200 flex flex-col">
              <CardHeader className="text-center bg-blue-50 border-b border-blue-100">
                <CardTitle className="text-xl font-bold text-gray-900">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$40</span>
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  For businesses with high-volume SMS marketing needs and custom requirements.
                </p>
              </CardHeader>
              <CardContent className="pt-6 flex-grow">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">4000 SMS credits per month</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Unlimited AI copywriting</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-800 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">24/7 priority support</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <Button className="w-full bg-blue-800 hover:bg-blue-700 py-4">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Trusted by businesses worldwide</h2>
          </div>
          <div className="mt-8 flex justify-center space-x-8 grayscale opacity-70">
            {['TechCrunch', 'Forbes', 'Wired', 'CNN', 'Bloomberg'].map((brand) => (
              <div key={brand} className="flex items-center">
                <span className="text-lg font-semibold text-gray-500">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">LightSMS</h3>
              <p className="text-gray-400 text-sm">
                Powerful bulk SMS messaging platform for businesses of all sizes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} LightSMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

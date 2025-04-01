import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { smsService, authService } from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [recipients, setRecipients] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        authService.logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!phone || !message) {
      setError('Phone number and message are required');
      return;
    }
    
    try {
      setSending(true);
      const response = await smsService.sendSingleSMS(phone, message);
      setResult(response);
      if (response.success) {
        setPhone('');
        setMessage('');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!recipients || !message) {
      setError('Recipients and message are required');
      return;
    }
    
    try {
      setSending(true);
      
      const phoneNumbers = recipients
        .split(',')
        .map(num => num.trim())
        .filter(num => num)
        .map(phone => ({ phone }));
      
      if (phoneNumbers.length === 0) {
        setError('No valid phone numbers provided');
        setSending(false);
        return;
      }
      
      const response = await smsService.sendBulkSMS(phoneNumbers, message);
      setResult(response);
      if (response.total_sent > 0) {
        setRecipients('');
        setMessage('');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send bulk SMS');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-800">LightSMS</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.full_name || 'User'}</span>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Single SMS Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send Single SMS</CardTitle>
              <CardDescription>
                Send an SMS message to a single recipient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendSingle} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single-message">Message</Label>
                  <Textarea
                    id="single-message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-blue-800 hover:bg-blue-700"
                >
                  {sending ? 'Sending...' : 'Send SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bulk SMS Card */}
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk SMS</CardTitle>
              <CardDescription>
                Send the same message to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBulk} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                  <Textarea
                    id="recipients"
                    placeholder="+1234567890, +2345678901, +3456789012"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-message">Message</Label>
                  <Textarea
                    id="bulk-message"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-blue-800 hover:bg-blue-700"
                >
                  {sending ? 'Sending...' : 'Send Bulk SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {(error || result) && (
          <div className="mt-8">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>SMS Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success !== undefined ? (
                    <div>
                      <p className="font-semibold">
                        Status: <span className={result.success ? "text-green-600" : "text-red-600"}>
                          {result.success ? "Success" : "Failed"}
                        </span>
                      </p>
                      <p>Message: {result.message}</p>
                      {result.text_id && <p>Text ID: {result.text_id}</p>}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">
                        Summary: Sent {result.total_sent} / Failed {result.total_failed}
                      </p>
                      <div className="mt-4 max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {result.results.map((item: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {item.success ? 'Success' : 'Failed'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

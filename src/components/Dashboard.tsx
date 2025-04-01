import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { smsService, authService } from '../services/api';
import BulkUpload from './BulkUpload';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  totalMessages: number;
  deliveredMessages: number;
}

interface Message {
  id: string;
  campaignId: string;
  contact: {
    phoneNumber: string;
    firstName?: string;
  };
  status: string;
  deliveryStatus?: string;
  sentAt?: string;
  deliveredAt?: string;
  hasResponse?: boolean;
  externalId?: string;
}

interface QuotaInfo {
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
  resetDate?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [recipients, setRecipients] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('send');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({
    quotaTotal: 0,
    quotaUsed: 0,
    quotaRemaining: 0
  });
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setCampaigns([
          {
            id: '1',
            name: 'Welcome Campaign',
            createdAt: new Date().toISOString(),
            status: 'completed',
            totalMessages: 120,
            deliveredMessages: 115
          },
          {
            id: '2',
            name: 'Promotional Offer',
            createdAt: new Date().toISOString(),
            status: 'in_progress',
            totalMessages: 250,
            deliveredMessages: 180
          }
        ]);
        
        setQuota({
          quotaTotal: 1000,
          quotaUsed: 350,
          quotaRemaining: 650,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        if (selectedCampaign) {
          setMessages([
            {
              id: '101',
              campaignId: selectedCampaign,
              contact: {
                phoneNumber: '+12345678901',
                firstName: 'John'
              },
              status: 'delivered',
              deliveryStatus: 'DELIVERED',
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              deliveredAt: new Date(Date.now() - 3540000).toISOString(),
              hasResponse: true,
              externalId: 'ext_101'
            },
            {
              id: '102',
              campaignId: selectedCampaign,
              contact: {
                phoneNumber: '+12345678902',
                firstName: 'Jane'
              },
              status: 'delivered',
              deliveryStatus: 'DELIVERED',
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              deliveredAt: new Date(Date.now() - 3500000).toISOString(),
              hasResponse: false,
              externalId: 'ext_102'
            },
            {
              id: '103',
              campaignId: selectedCampaign,
              contact: {
                phoneNumber: '+12345678903',
                firstName: 'Bob'
              },
              status: 'failed',
              deliveryStatus: 'FAILED',
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              externalId: 'ext_103'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    
    fetchDashboardData();
    
    const intervalId = setInterval(() => {
      setIsRefreshing(true);
      fetchDashboardData().finally(() => {
        setIsRefreshing(false);
      });
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, selectedCampaign]);
  
  useEffect(() => {
    if (selectedCampaign) {
      const checkMessageStatuses = async () => {
        try {
          const pendingMessages = messages
            .filter(msg => msg.campaignId === selectedCampaign && 
                   msg.status !== 'delivered' && 
                   msg.deliveryStatus !== 'DELIVERED');
          
          for (const msg of pendingMessages) {
            if (msg.externalId) {
              console.log(`Checking status for message ${msg.externalId}`);
            }
          }
        } catch (err) {
          console.error('Failed to check message statuses:', err);
        }
      };
      
      checkMessageStatuses();
    }
  }, [selectedCampaign, messages]);

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
  
  const getStatusData = () => {
    if (!selectedCampaign || !messages.length) return [];
    
    const campaignMessages = messages.filter(msg => msg.campaignId === selectedCampaign);
    const statusCounts: Record<string, number> = {
      delivered: 0,
      sent: 0,
      sending: 0,
      failed: 0,
      unknown: 0
    };
    
    campaignMessages.forEach(msg => {
      const status = msg.deliveryStatus ? msg.deliveryStatus.toLowerCase() : msg.status.toLowerCase();
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        statusCounts.unknown++;
      }
    });
    
    return Object.entries(statusCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value
      }));
  };
  
  const getDeliveryTimeData = () => {
    if (!selectedCampaign || !messages.length) return [];
    
    const campaignMessages = messages.filter(
      msg => msg.campaignId === selectedCampaign && msg.deliveredAt
    );
    
    const hourCounts: Record<number, number> = {};
    campaignMessages.forEach(msg => {
      if (msg.deliveredAt) {
        const hour = new Date(msg.deliveredAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }))
      .sort((a, b) => a.hour - b.hour);
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  const refreshCampaignData = async () => {
    if (selectedCampaign) {
      setIsRefreshing(true);
      try {
        console.log(`Refreshing data for campaign ${selectedCampaign}`);
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      } catch (err) {
        console.error('Failed to refresh campaign data:', err);
        setIsRefreshing(false);
      }
    }
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
        <Tabs defaultValue="send" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="send">Send SMS</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="send">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Quota Card */}
              <Card className="bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">SMS Quota</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{quota.quotaRemaining || 0}</div>
                  <div className="text-sm text-gray-600">Messages Remaining</div>
                </CardContent>
              </Card>
              
              {/* Used Quota Card */}
              <Card className="bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">SMS Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{quota.quotaUsed || 0}</div>
                  <div className="text-sm text-gray-600">Messages Sent</div>
                </CardContent>
              </Card>
              
              {/* Total Quota Card */}
              <Card className="bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Quota</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{quota.quotaTotal || 0}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </CardContent>
              </Card>
            </div>
            
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
          </TabsContent>
          
          <TabsContent value="campaigns">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Select Campaign</h3>
              <Select 
                value={selectedCampaign || ''} 
                onValueChange={(value) => setSelectedCampaign(value || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Select a campaign --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Select a campaign --</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} ({new Date(campaign.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCampaign && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {getStatusData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Delivery Time Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Time Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={getDeliveryTimeData()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="hour" 
                              tickFormatter={(hour) => `${hour}:00`}
                              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis label={{ value: 'Messages', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              formatter={(value, name, props) => [value, 'Messages']}
                              labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Message List */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Message Details</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshCampaignData}
                        disabled={isRefreshing}
                      >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead>
                          <tr>
                            <th className="py-2 px-4 border-b">Contact</th>
                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b">Sent At</th>
                            <th className="py-2 px-4 border-b">Delivered At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {messages
                            .filter(msg => msg.campaignId === selectedCampaign)
                            .map(msg => (
                              <tr key={msg.id}>
                                <td className="py-2 px-4 border-b">{msg.contact?.phoneNumber || 'Unknown'}</td>
                                <td className="py-2 px-4 border-b">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    (msg.status === 'delivered' || msg.deliveryStatus === 'DELIVERED') 
                                      ? 'bg-green-100 text-green-800'
                                      : msg.status === 'failed' || msg.deliveryStatus === 'FAILED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {msg.deliveryStatus || msg.status}
                                  </span>
                                </td>
                                <td className="py-2 px-4 border-b">
                                  {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A'}
                                </td>
                                <td className="py-2 px-4 border-b">
                                  {msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Refresh Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Label className="mr-3">Refresh Every:</Label>
                    <Select
                      value={refreshInterval.toString()}
                      onValueChange={(value) => setRefreshInterval(parseInt(value))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk">
            <BulkUpload />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;

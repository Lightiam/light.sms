import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { DateTimePicker } from './ui/date-time-picker';
import { predictOptimalSendTimes, generateMessageSuggestions } from '../services/mlService';
import { Template, ContactGroup, Contact } from '../types';

interface CampaignData {
  name: string;
  message: string;
  contactGroupIds: string[];
  scheduledTime: string;
  useOptimalTime: boolean;
}

const CampaignCreator: React.FC = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());
  const [useOptimalTime, setUseOptimalTime] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messageSuggestions, setMessageSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setContactGroups([
          { id: '1', name: 'Customers', count: 120, createdAt: new Date().toISOString() },
          { id: '2', name: 'Leads', count: 85, createdAt: new Date().toISOString() },
          { id: '3', name: 'Newsletter Subscribers', count: 250, createdAt: new Date().toISOString() }
        ]);
        
        setTemplates([
          { 
            id: '1', 
            name: 'Welcome Message', 
            content: 'Welcome to our service! We\'re excited to have you on board.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: '2', 
            name: 'Promotional Offer', 
            content: 'Special offer just for you! Use code SMS10 for 10% off your next purchase.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: '3', 
            name: 'Appointment Reminder', 
            content: 'Reminder: You have an appointment scheduled for {date} at {time}.', 
            createdAt: new Date().toISOString() 
          }
        ]);

        setContacts([
          { id: '1', name: 'John Doe', phone: '+12345678901', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', phone: '+12345678902', email: 'jane@example.com' },
          { id: '3', name: 'Bob Johnson', phone: '+12345678903', email: 'bob@example.com' }
        ]);

        const suggestions = await generateMessageSuggestions('retail', 'promotional');
        setMessageSuggestions(suggestions);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load contact groups and templates');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setMessage(selectedTemplate.content);
    }
  }, [selectedTemplate]);

  const handleGroupSelection = (groupId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedGroups([...selectedGroups, groupId]);
    } else {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !message || selectedGroups.length === 0) {
      setError('Please fill in all required fields and select at least one contact group');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      let optimizedContacts: Contact[] = [];
      if (useOptimalTime) {
        optimizedContacts = await predictOptimalSendTimes(contacts, message);
        console.log('Optimized send times:', optimizedContacts);
      }
      
      const campaignData: CampaignData = {
        name,
        message,
        contactGroupIds: selectedGroups,
        scheduledTime: scheduledTime ? scheduledTime.toISOString() : new Date().toISOString(),
        useOptimalTime
      };
      
      console.log('Creating campaign:', campaignData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(useOptimalTime 
        ? 'Campaign scheduled successfully with ML-optimized send times!' 
        : 'Campaign scheduled successfully!');
      
      setName('');
      setMessage('');
      setSelectedGroups([]);
      setScheduledTime(new Date());
      setUseOptimalTime(false);
      setUseTemplate(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError('Failed to schedule campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MessageTemplateSelector = () => (
    <div className="space-y-2">
      <Label htmlFor="template-select">Select Template</Label>
      <select
        id="template-select"
        value={selectedTemplate?.id || ''}
        onChange={(e) => {
          const template = templates.find(t => t.id === e.target.value);
          setSelectedTemplate(template || null);
        }}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">-- Select a template --</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      {selectedTemplate && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{selectedTemplate.content}</p>
        </div>
      )}
    </div>
  );

  const ContactGroupSelector = () => (
    <div className="space-y-2">
      {contactGroups.map(group => (
        <div key={group.id} className="flex items-center space-x-2">
          <Checkbox
            id={`group-${group.id}`}
            checked={selectedGroups.includes(group.id)}
            onCheckedChange={(checked) => handleGroupSelection(group.id, checked === true)}
          />
          <Label htmlFor={`group-${group.id}`} className="cursor-pointer">
            {group.name} <span className="text-sm text-gray-500">({group.count} contacts)</span>
          </Label>
        </div>
      ))}
      {contactGroups.length === 0 && (
        <p className="text-sm text-gray-500">No contact groups available</p>
      )}
    </div>
  );

  const MLOptimizationToggle = () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ml-optimization"
          checked={useOptimalTime}
          onCheckedChange={(checked) => setUseOptimalTime(checked === true)}
        />
        <Label htmlFor="ml-optimization" className="cursor-pointer">
          Use ML to determine optimal send time for each recipient
        </Label>
      </div>
      {useOptimalTime && (
        <div className="ml-6 text-sm text-gray-600">
          <p>Our ML model will analyze each recipient's engagement patterns to determine the best time to deliver your message.</p>
        </div>
      )}
    </div>
  );
  
  const MessageSuggestions = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>AI Message Suggestions</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
        </Button>
      </div>
      
      {showSuggestions && (
        <div className="space-y-2 mt-2">
          {messageSuggestions.map((suggestion, index) => (
            <div 
              key={index} 
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => setMessage(suggestion)}
            >
              <p className="text-sm">{suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-template"
                  checked={useTemplate}
                  onCheckedChange={(checked) => setUseTemplate(checked === true)}
                />
                <Label htmlFor="use-template" className="cursor-pointer">
                  Use Template
                </Label>
              </div>
            </div>
            
            {useTemplate ? (
              <MessageTemplateSelector />
            ) : (
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[100px]"
                required
              />
            )}
            
            <MessageSuggestions />
          </div>
          
          <div className="space-y-2">
            <Label>Select Contact Groups</Label>
            <ContactGroupSelector />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scheduled-time">Schedule Time</Label>
            <DateTimePicker
              value={scheduledTime}
              onChange={(value: Date | null) => setScheduledTime(value || new Date())}
              className="border rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <MLOptimizationToggle />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-800 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Campaign'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignCreator;

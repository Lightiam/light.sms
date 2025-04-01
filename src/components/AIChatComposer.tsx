import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';

import { Paperclip, Mic, Send, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatComposerProps {
  onMessageGenerated?: (message: string) => void;
}

const AIChatComposer: React.FC<AIChatComposerProps> = ({ onMessageGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I can help you craft the perfect SMS message. What kind of message would you like to create today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      let aiResponse = '';
      if (input.toLowerCase().includes('promotion')) {
        aiResponse = "Here's a promotional message template: \"Limited time offer! Get 20% off your next purchase with code SMS20. Valid until [date]. Reply STOP to opt out.\"";
      } else if (input.toLowerCase().includes('reminder')) {
        aiResponse = "Here's a reminder message template: \"Reminder: Your appointment is scheduled for [date] at [time]. Reply Y to confirm or call us to reschedule.\"";
      } else if (input.toLowerCase().includes('announcement')) {
        aiResponse = "Here's an announcement template: \"Important update from [Company]: We're excited to announce [news]. Visit our website for more details.\"";
      } else {
        aiResponse = "I've created a message based on your request: \"Thank you for being a valued customer! We appreciate your business and look forward to serving you again soon.\"";
      }

      const messageMatch = aiResponse.match(/"([^"]+)"/);
      const extractedMessage = messageMatch ? messageMatch[1] : '';
      
      if (extractedMessage) {
        setGeneratedMessage(extractedMessage);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseMessage = () => {
    if (onMessageGenerated && generatedMessage) {
      onMessageGenerated(generatedMessage);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Prompt Examples */}
      <div className="w-64 border-r bg-gray-50 p-4 hidden md:block">
        <h3 className="font-medium text-sm mb-3">How to use AI</h3>
        <ul className="space-y-4 text-sm text-gray-600">
          <li className="space-y-1">
            <p className="font-medium">Ask for message suggestions</p>
            <p className="text-xs">Ask the AI to create SMS templates for different purposes</p>
          </li>
          <li className="space-y-1">
            <p className="font-medium">Request specific formats</p>
            <p className="text-xs">Specify character limits, tone, or style for your messages</p>
          </li>
          <li className="space-y-1">
            <p className="font-medium">Include variable placeholders</p>
            <p className="text-xs">Ask for templates with [name], [date], or other variables</p>
          </li>
          <li className="space-y-1">
            <p className="font-medium">Request industry-specific content</p>
            <p className="text-xs">Specify if you need messages for healthcare, retail, etc.</p>
          </li>
          <li className="space-y-1">
            <p className="font-medium">Ask for compliance guidance</p>
            <p className="text-xs">Request messages that follow SMS marketing best practices</p>
          </li>
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col border-0 rounded-none shadow-none">
          <CardHeader className="px-4 py-3 border-b">
            <CardTitle className="text-lg">AI Message Composer</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg' 
                        : 'bg-gray-100 text-gray-800 rounded-tr-lg rounded-bl-lg rounded-br-lg'
                    } p-3`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 mr-2">
                        <div className="bg-blue-100 text-blue-800 rounded-full h-full w-full flex items-center justify-center">
                          AI
                        </div>
                      </Avatar>
                    )}
                    <div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={() => alert('File upload feature coming soon')}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message request here..."
                className="min-h-[60px] resize-none rounded-full"
                disabled={isLoading}
              />
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => alert('Voice input feature coming soon')}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 hover:bg-green-500 rounded-full"
                  size="icon"
                >
                  {isLoading ? 
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 
                    <Send className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Listening to Project? <span className="text-green-600 font-medium">Yes</span>
              </p>
              
              {generatedMessage && (
                <Button 
                  onClick={handleUseMessage} 
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Use Generated Message <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Right Sidebar - Settings */}
      <div className="w-64 border-l bg-gray-50 p-4 hidden lg:block">
        <h3 className="font-medium text-sm mb-3">Message Settings</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-1">Character limit</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">160 characters</span>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                Edit
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-1">Message tone</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Professional</span>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                Change
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-1">Include variables</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Name, Date</span>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                Add
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-1">Industry</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">E-commerce</span>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                Select
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-1">Compliance check</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600">Enabled</span>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                Disable
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium mb-1">Generated messages</p>
            <div className="text-xs text-gray-500">
              {generatedMessage ? '1 message ready to use' : 'No messages yet'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatComposer;

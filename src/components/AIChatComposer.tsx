import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  const [activeTab, setActiveTab] = useState('compose');
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
    <Card className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">AI Message Composer</CardTitle>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="flex-1 flex flex-col p-0 m-0">
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
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message request here..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                className="bg-blue-800 hover:bg-blue-700"
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Prompt examples: "Create a promotional message for our summer sale" or "Draft a reminder for an upcoming appointment"
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="flex-1 flex flex-col p-0 m-0">
          <CardContent className="flex-1 p-4 flex flex-col">
            <div className="flex-1">
              <h3 className="font-medium mb-2">Generated Message</h3>
              <div className="border rounded-lg p-3 bg-gray-50 min-h-[200px]">
                {generatedMessage ? (
                  <p>{generatedMessage}</p>
                ) : (
                  <p className="text-gray-400">No message generated yet. Use the Compose tab to create a message.</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleUseMessage} 
                disabled={!generatedMessage}
                className="bg-blue-800 hover:bg-blue-700"
              >
                Use This Message
              </Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AIChatComposer;

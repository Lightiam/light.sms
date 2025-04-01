import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { smsService } from '../services/api';

interface Contact {
  phone: string;
  firstName?: string;
  customFields?: Record<string, string>;
}

interface PreviewData {
  [key: string]: string;
}

const BulkUpload: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [, setFileName] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [phoneColumn, setPhoneColumn] = useState<string>('');
  const [nameColumn, setNameColumn] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [validContacts, setValidContacts] = useState<Contact[]>([]);
  const [invalidContacts, setInvalidContacts] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [campaignName, setCampaignName] = useState<string>('');
  const [replaceVariables, setReplaceVariables] = useState<boolean>(true);
  const [sendImmediately, setSendImmediately] = useState<boolean>(true);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetForm = () => {
    setFile(null);
    setFileName('');
    setPreviewData([]);
    setHeaders([]);
    setPhoneColumn('');
    setNameColumn('');
    setGroupName('');
    setMessage('');
    setCampaignName('');
    setValidContacts([]);
    setInvalidContacts([]);
    setError('');
    setSuccess(false);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setError('The CSV file appears to be empty');
            return;
          }
          
          setPreviewData(results.data as PreviewData[]);
          setHeaders(results.meta.fields || []);
          
          const possiblePhoneColumns = (results.meta.fields || []).filter(field => 
            field.toLowerCase().includes('phone') || 
            field.toLowerCase().includes('mobile') || 
            field.toLowerCase().includes('cell')
          );
          
          const possibleNameColumns = (results.meta.fields || []).filter(field => 
            field.toLowerCase().includes('name') ||
            field.toLowerCase().includes('first')
          );
          
          if (possiblePhoneColumns.length > 0) {
            setPhoneColumn(possiblePhoneColumns[0]);
          }
          
          if (possibleNameColumns.length > 0) {
            setNameColumn(possibleNameColumns[0]);
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setError(`File parsing failed: ${error.message}`);
        }
      });
    }
  };
  
  const validateCSV = () => {
    if (!phoneColumn) {
      setError('Please select a phone number column');
      return false;
    }
    
    if (!groupName) {
      setError('Please enter a contact group name');
      return false;
    }
    
    return true;
  };
  
  const handleNextStep = () => {
    if (step === 1) {
      if (!file) {
        setError('Please select a CSV file');
        return;
      }
      
      if (!validateCSV()) {
        return;
      }
      
      setStep(2);
      setError('');
    } else if (step === 2) {
      if (!message.trim()) {
        setError('Please enter a message');
        return;
      }
      
      if (!campaignName.trim()) {
        setError('Please enter a campaign name');
        return;
      }
      
      processCSV();
    }
  };
  
  const handlePreviousStep = () => {
    setError('');
    setStep(step - 1);
  };
  
  const processCSV = useCallback(() => {
    if (!file || !phoneColumn) return;
    
    setLoading(true);
    setError('');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const valid: Contact[] = [];
        const invalid: Record<string, string>[] = [];
        
        (results.data as PreviewData[]).forEach((row) => {
          const phoneVal = row[phoneColumn];
          
          if (phoneVal && /^\+?[0-9]{10,15}$/.test(phoneVal.replace(/\D/g, ''))) {
            const contact: Contact = {
              phone: phoneVal,
              customFields: {}
            };
            
            if (nameColumn && row[nameColumn]) {
              contact.firstName = row[nameColumn];
            }
            
            Object.keys(row).forEach(key => {
              if (key !== phoneColumn && key !== nameColumn && row[key]) {
                if (!contact.customFields) contact.customFields = {};
                contact.customFields[key] = row[key];
              }
            });
            
            valid.push(contact);
          } else {
            invalid.push({
              ...row,
              error: 'Invalid phone number format'
            });
          }
        });
        
        setValidContacts(valid);
        setInvalidContacts(invalid);
        setLoading(false);
        setStep(3);
      },
      error: (error) => {
        setError(`Error processing CSV: ${error.message}`);
        setLoading(false);
      }
    });
  }, [file, phoneColumn, nameColumn]);
  
  const handleSendMessages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const processedContacts = validContacts.map(contact => {
        let personalizedMessage = message;
        
        if (contact.firstName) {
          personalizedMessage = personalizedMessage.replace(/\{firstName\}/g, contact.firstName);
        } else {
          personalizedMessage = personalizedMessage.replace(/\{firstName\}/g, '');
        }
        
        if (contact.customFields) {
          Object.entries(contact.customFields).forEach(([key, value]) => {
            personalizedMessage = personalizedMessage.replace(
              new RegExp(`\\{${key}\\}`, 'g'), 
              value
            );
          });
        }
        
        return {
          phone: contact.phone,
          message: personalizedMessage
        };
      });
      
      await smsService.sendBulkSMS(
        processedContacts.map(c => ({ phone: c.phone })),
        message // Using original message as a fallback
      );
      
      setSuccess(true);
      setLoading(false);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send messages';
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  const getPreviewMessage = (contact: PreviewData) => {
    if (!replaceVariables || !message) {
      return message;
    }
    
    let previewMessage = message;
    
    if (nameColumn && contact[nameColumn]) {
      previewMessage = previewMessage.replace(/\{firstName\}/g, contact[nameColumn]);
    }
    
    Object.keys(contact).forEach(key => {
      previewMessage = previewMessage.replace(
        new RegExp(`\\{${key}\\}`, 'g'), 
        contact[key] || ''
      );
    });
    
    return previewMessage;
  };
  
  const stepClass = (stepNum: number) => 
    `flex flex-col items-center ${step === stepNum ? 'text-blue-600' : step > stepNum ? 'text-green-600' : 'text-gray-400'}`;
  
  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Messages Sent Successfully!</h2>
          <p className="mb-6">Your bulk SMS campaign has been processed.</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Send Another Batch
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Bulk SMS Upload</h2>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className={stepClass(1)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span>Upload Contacts</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          <div className={stepClass(2)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span>Compose Message</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          <div className={stepClass(3)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span>Review & Send</span>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Step 1: Upload Contacts */}
      {step === 1 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Upload Contact List</h3>
          
          <div className="mb-4">
            <Label className="block mb-2">Contact Group Name</Label>
            <Input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full"
              placeholder="Enter a name for this contact group"
              required
            />
          </div>
          
          <div className="mb-4">
            <Label className="block mb-2">Upload CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              CSV file should contain phone numbers and optionally names and other fields.
            </p>
          </div>
          
          {headers.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="block mb-2">Phone Number Column</Label>
                  <select
                    value={phoneColumn}
                    onChange={(e) => setPhoneColumn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label className="block mb-2">Name Column (Optional)</Label>
                  <select
                    value={nameColumn}
                    onChange={(e) => setNameColumn(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- None --</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Preview Data</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr>
                        {headers.map(header => (
                          <th key={header} className="px-4 py-2 border bg-gray-50">
                            {header}
                            {header === phoneColumn && ' (Phone)'}
                            {header === nameColumn && ' (Name)'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 3).map((row, index) => (
                        <tr key={index}>
                          {headers.map(header => (
                            <td key={`${index}-${header}`} className="px-4 py-2 border">
                              {row[header] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Showing first 3 rows of {previewData.length} total rows.
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Step 2: Compose Message */}
      {step === 2 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Compose SMS Message</h3>
          
          <div className="mb-4">
            <Label className="block mb-2">Campaign Name</Label>
            <Input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full"
              placeholder="Enter a name for this campaign"
              required
            />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-gray-700">Message</Label>
              <span className="text-sm text-gray-500">
                {message.length} / 160 characters
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
              rows={4}
              placeholder="Enter your message here"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              <p>Available variables:</p>
              <ul className="list-disc ml-5">
                {nameColumn && <li>{'{firstName}'} - Recipient's name</li>}
                {headers.filter(h => h !== phoneColumn && h !== nameColumn).map(field => (
                  <li key={field}>{`{${field}}`} - {field}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="replaceVariables"
                checked={replaceVariables}
                onChange={() => setReplaceVariables(!replaceVariables)}
                className="mr-2"
              />
              <Label htmlFor="replaceVariables" className="text-gray-700">
                Replace variables in message
              </Label>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendImmediately"
                checked={sendImmediately}
                onChange={() => setSendImmediately(!sendImmediately)}
                className="mr-2"
              />
              <Label htmlFor="sendImmediately" className="text-gray-700">
                Send immediately
              </Label>
            </div>
          </div>
          
          {!sendImmediately && (
            <div className="mb-4">
              <Label className="block mb-2">Schedule Time</Label>
              <Input
                type="datetime-local"
                value={scheduledTime.toISOString().slice(0, 16)}
                onChange={(e) => setScheduledTime(new Date(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          {replaceVariables && previewData.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Message Preview</h4>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold text-sm mb-1">Preview for: {
                  previewData[0][nameColumn] || 'Unknown Recipient'
                }</p>
                <p className="whitespace-pre-wrap">{getPreviewMessage(previewData[0])}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Review & Send</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Contact Summary</h4>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p><span className="font-semibold">Group Name:</span> {groupName}</p>
                <p><span className="font-semibold">Total Contacts:</span> {validContacts.length}</p>
                <p><span className="font-semibold">Valid Contacts:</span> {validContacts.length}</p>
                <p><span className="font-semibold">Invalid Contacts:</span> {invalidContacts.length}</p>
                <p><span className="font-semibold">Phone Number Column:</span> {phoneColumn}</p>
                {nameColumn && (
                  <p><span className="font-semibold">Name Column:</span> {nameColumn}</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Campaign Summary</h4>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p><span className="font-semibold">Campaign Name:</span> {campaignName}</p>
                <p><span className="font-semibold">Total SMS:</span> {validContacts.length}</p>
                <p>
                  <span className="font-semibold">Send Time:</span> {
                    sendImmediately 
                      ? 'Immediately after confirmation' 
                      : scheduledTime.toLocaleString()
                  }
                </p>
                <p>
                  <span className="font-semibold">Use Variables:</span> {
                    replaceVariables ? 'Yes' : 'No'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Message Preview</h4>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="whitespace-pre-wrap">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Character count: {message.length} / 160
                {message.length > 160 && (
                  <span className="text-red-500 ml-2">
                    This will be sent as multiple messages
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {validContacts.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Sample Recipients</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border bg-gray-50">Phone</th>
                      {nameColumn && (
                        <th className="px-4 py-2 border bg-gray-50">Name</th>
                      )}
                      <th className="px-4 py-2 border bg-gray-50">Message Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validContacts.slice(0, 3).map((contact, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border">{contact.phone}</td>
                        {nameColumn && (
                          <td className="px-4 py-2 border">{contact.firstName || ''}</td>
                        )}
                        <td className="px-4 py-2 border">
                          {replaceVariables ? (
                            <span className="whitespace-pre-wrap">
                              {getPreviewMessage(previewData.find(row => row[phoneColumn] === contact.phone) || {})}
                            </span>
                          ) : (
                            <span className="whitespace-pre-wrap">{message}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Showing {Math.min(validContacts.length, 3)} of {validContacts.length} total recipients.
              </p>
            </div>
          )}
          
          {invalidContacts.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Invalid Contacts</h4>
              <Alert variant="destructive">
                <AlertDescription>
                  {invalidContacts.length} contacts have invalid phone numbers and will be skipped.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border bg-gray-50">Phone</th>
                      {nameColumn && (
                        <th className="px-4 py-2 border bg-gray-50">Name</th>
                      )}
                      <th className="px-4 py-2 border bg-gray-50">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidContacts.slice(0, 3).map((contact, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border">{contact[phoneColumn] || ''}</td>
                        {nameColumn && (
                          <td className="px-4 py-2 border">{contact[nameColumn] || ''}</td>
                        )}
                        <td className="px-4 py-2 border text-red-500">{contact.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Showing {Math.min(invalidContacts.length, 3)} of {invalidContacts.length} invalid contacts.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <Button variant="outline" onClick={handlePreviousStep} disabled={loading}>
            Back
          </Button>
        ) : (
          <div></div>
        )}
        
        {step < 3 ? (
          <Button onClick={handleNextStep} disabled={loading}>
            {loading ? 'Processing...' : 'Next'}
          </Button>
        ) : (
          <Button onClick={handleSendMessages} disabled={loading || validContacts.length === 0}>
            {loading ? 'Sending...' : `Send ${validContacts.length} Messages`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;

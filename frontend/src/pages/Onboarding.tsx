import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://ai-basaas.railway.app';

interface Service {
  name: string;
  durationMin: number;
  price: number;
}

interface FAQ {
  q: string;
  a: string;
}

interface BusinessHours {
  [key: string]: string[][];
}

const Onboarding: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('business');
  
  // Business Details
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+1-256-935-1911');
  const [address, setAddress] = useState('510 E Meighan Blvd a10, Gadsden, AL 35903');
  const [timezone, setTimezone] = useState('America/Chicago');
  
  // Services
  const [services, setServices] = useState<Service[]>([
    { name: 'First Visit', durationMin: 30, price: 29 },
    { name: 'Adjustment', durationMin: 15, price: 45 }
  ]);
  
  // Hours
  const [hours, setHours] = useState<BusinessHours>({
    mon: [['10:00', '14:00'], ['14:45', '19:00']],
    tue: [['10:00', '14:00'], ['14:45', '19:00']],
    wed: [],
    thu: [['10:00', '14:00'], ['14:45', '19:00']],
    fri: [['10:00', '14:00'], ['14:45', '19:00']],
    sat: [['10:00', '16:00']],
    sun: []
  });
  
  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([
    { q: 'Do you take walk-ins?', a: 'Yes, subject to availability.' },
    { q: 'Is the $29 special available?', a: 'Yes — consult, exam and adjustment.' }
  ]);
  
  // Brand
  const [primaryColor, setPrimaryColor] = useState('#0EA5E9');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Integrations
  const [integrations, setIntegrations] = useState({
    google: { connected: false, calendarId: '' },
    facebook: { connected: false, pageId: '' },
    instagram: { connected: false, businessId: '' }
  });
  
  // Activation Result
  const [activationResult, setActivationResult] = useState<any>(null);

  // Register/Login
  const handleAuth = async () => {
    setLoading(true);
    try {
      // Try login first
      try {
        const loginRes = await axios.post(`${API_URL}/api/v1/auth/login`, {
          email,
          password
        });
        localStorage.setItem('token', loginRes.data.token);
        setToken(loginRes.data.token);
        alert('Logged in successfully!');
      } catch (e) {
        // If login fails, register
        const registerRes = await axios.post(`${API_URL}/api/v1/auth/register`, {
          email,
          password,
          name: businessName
        });
        localStorage.setItem('token', registerRes.data.token);
        setToken(registerRes.data.token);
        alert('Registered successfully!');
      }
    } catch (error: any) {
      alert('Auth error: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save Configuration
  const saveConfig = async () => {
    if (!token) {
      alert('Please login first');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/onboarding/save`,
        {
          phone,
          timezone,
          address,
          services,
          hours,
          faqs,
          brand: { primaryColor, logoUrl },
          flags: {
            websiteWidget: true,
            socialDM: ['facebook', 'instagram'],
            emailEnabled: true
          },
          selectedCalendarId: integrations.google.calendarId || 'primary'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Configuration saved!');
    } catch (error: any) {
      alert('Save error: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Connect Integration
  const connectIntegration = (provider: string) => {
    if (!token) {
      alert('Please login first');
      return;
    }
    window.location.href = `${API_URL}/api/integrations/${provider}/start?token=${token}`;
  };

  // Activate Bot
  const activateBot = async () => {
    if (!token) {
      alert('Please login first');
      return;
    }
    
    if (!integrations.google.connected || !integrations.google.calendarId) {
      alert('Please connect Google Calendar and select a calendar first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/onboarding/activate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setActivationResult(response.data);
      alert('Bot activated successfully!');
    } catch (error: any) {
      alert('Activation error: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load integration status
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/integrations/status`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const status = res.data;
        setIntegrations({
          google: {
            connected: !!status.google,
            calendarId: status.google?.metadata?.calendarId || ''
          },
          facebook: {
            connected: !!status.facebook,
            pageId: status.facebook?.externalId || ''
          },
          instagram: {
            connected: !!status.instagram,
            businessId: status.instagram?.externalId || ''
          }
        });
      }).catch(console.error);
    }
  }, [token]);

  const tabs = ['business', 'services', 'hours', 'faqs', 'brand', 'integrations', 'activate'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Healthcare Bot Onboarding</h1>
        
        {!token && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Login / Register</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Business Name"
                className="border rounded px-3 py-2"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className="border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="border rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handleAuth}
              disabled={loading}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login / Register'}
            </button>
          </div>
        )}

        {token && (
          <>
            {/* Tabs */}
            <div className="flex space-x-2 mb-6 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded capitalize ${
                    activeTab === tab 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Business Details */}
            {activeTab === 'business' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Business Details</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Phone"
                    className="w-full border rounded px-3 py-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    className="w-full border rounded px-3 py-2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            )}

            {/* Services */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Services</h2>
                {services.map((service, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Service name"
                      className="flex-1 border rounded px-3 py-2"
                      value={service.name}
                      onChange={(e) => {
                        const newServices = [...services];
                        newServices[index].name = e.target.value;
                        setServices(newServices);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Duration (min)"
                      className="w-32 border rounded px-3 py-2"
                      value={service.durationMin}
                      onChange={(e) => {
                        const newServices = [...services];
                        newServices[index].durationMin = parseInt(e.target.value);
                        setServices(newServices);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-24 border rounded px-3 py-2"
                      value={service.price}
                      onChange={(e) => {
                        const newServices = [...services];
                        newServices[index].price = parseFloat(e.target.value);
                        setServices(newServices);
                      }}
                    />
                    <button
                      onClick={() => setServices(services.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setServices([...services, { name: '', durationMin: 30, price: 0 }])}
                  className="mt-2 text-blue-500 hover:text-blue-700"
                >
                  + Add Service
                </button>
              </div>
            )}

            {/* Hours */}
            {activeTab === 'hours' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
                <div className="space-y-2">
                  {Object.entries(hours).map(([day, times]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <span className="w-12 capitalize">{day}:</span>
                      <input
                        type="text"
                        placeholder="e.g., 10:00-14:00,14:45-19:00"
                        className="flex-1 border rounded px-3 py-2"
                        value={times.map(t => t.join('-')).join(',')}
                        onChange={(e) => {
                          const newHours = { ...hours };
                          newHours[day] = e.target.value.split(',').map(t => t.split('-'));
                          setHours(newHours);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {activeTab === 'faqs' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">FAQs</h2>
                {faqs.map((faq, index) => (
                  <div key={index} className="mb-4 p-3 border rounded">
                    <input
                      type="text"
                      placeholder="Question"
                      className="w-full border rounded px-3 py-2 mb-2"
                      value={faq.q}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].q = e.target.value;
                        setFaqs(newFaqs);
                      }}
                    />
                    <textarea
                      placeholder="Answer"
                      className="w-full border rounded px-3 py-2"
                      value={faq.a}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[index].a = e.target.value;
                        setFaqs(newFaqs);
                      }}
                    />
                    <button
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== index))}
                      className="mt-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFaqs([...faqs, { q: '', a: '' }])}
                  className="mt-2 text-blue-500 hover:text-blue-700"
                >
                  + Add FAQ
                </button>
              </div>
            )}

            {/* Brand */}
            {activeTab === 'brand' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Brand Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">Primary Color</label>
                    <input
                      type="color"
                      className="w-full h-10"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Logo URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/logo.png"
                      className="w-full border rounded px-3 py-2"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Integrations</h2>
                <div className="space-y-4">
                  {/* Google */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-semibold">Google Calendar + Gmail</h3>
                      <p className="text-sm text-gray-600">
                        {integrations.google.connected ? '✅ Connected' : '❌ Not connected'}
                      </p>
                    </div>
                    <button
                      onClick={() => connectIntegration('google')}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      {integrations.google.connected ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                  
                  {integrations.google.connected && (
                    <input
                      type="text"
                      placeholder="Calendar ID (e.g., primary)"
                      className="w-full border rounded px-3 py-2"
                      value={integrations.google.calendarId}
                      onChange={(e) => setIntegrations({
                        ...integrations,
                        google: { ...integrations.google, calendarId: e.target.value }
                      })}
                    />
                  )}

                  {/* Facebook */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-semibold">Facebook Page</h3>
                      <p className="text-sm text-gray-600">
                        {integrations.facebook.connected ? `✅ Connected: ${integrations.facebook.pageId}` : '❌ Not connected'}
                      </p>
                    </div>
                    <button
                      onClick={() => connectIntegration('facebook')}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      {integrations.facebook.connected ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>

                  {/* Instagram */}
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-semibold">Instagram</h3>
                      <p className="text-sm text-gray-600">
                        {integrations.instagram.connected ? `✅ Connected: ${integrations.instagram.businessId}` : '❌ Not connected'}
                      </p>
                    </div>
                    <button
                      onClick={() => connectIntegration('instagram')}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      {integrations.instagram.connected ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={saveConfig}
                  disabled={loading}
                  className="mt-6 w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            )}

            {/* Activate */}
            {activeTab === 'activate' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Activate Bot</h2>
                
                <button
                  onClick={activateBot}
                  disabled={loading || !integrations.google.connected}
                  className="w-full bg-purple-500 text-white px-4 py-3 rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Activate Bot'}
                </button>
                
                {activationResult && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Chat Link:</h3>
                      <a href={activationResult.chatLink} className="text-blue-500 hover:underline">
                        {activationResult.chatLink}
                      </a>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Website Embed Code:</h3>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {activationResult.embedSnippet}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">n8n Payload:</h3>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(activationResult.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
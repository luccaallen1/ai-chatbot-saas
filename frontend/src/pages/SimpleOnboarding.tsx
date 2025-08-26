import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const SimpleOnboarding: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  
  // Auth form
  const [businessName, setBusinessName] = useState('Test Clinic');
  const [email, setEmail] = useState('testclinic@example.com');
  const [password, setPassword] = useState('password123');
  
  // Config
  const [phone, setPhone] = useState('+1-256-935-1911');
  const [address, setAddress] = useState('510 E Meighan Blvd a10, Gadsden, AL 35903');
  
  // Results
  const [result, setResult] = useState<any>(null);

  const handleAuth = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await axios.post(`${API_URL}/api/v1/auth/login`, { email, password });
      } catch (e) {
        res = await axios.post(`${API_URL}/api/v1/auth/register`, { email, password, name: businessName });
      }
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setResult({ type: 'auth', data: res.data });
    } catch (error: any) {
      setResult({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = () => {
    if (!token) return;
    window.location.href = `${API_URL}/api/integrations/google/start?token=${token}`;
  };

  const saveAndActivate = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Save config
      await axios.post(
        `${API_URL}/api/onboarding/save`,
        {
          phone,
          address,
          timezone: 'America/Chicago',
          services: [
            { name: 'First Visit', durationMin: 30, price: 29 },
            { name: 'Adjustment', durationMin: 15, price: 45 }
          ],
          hours: {
            mon: [['10:00', '14:00'], ['14:45', '19:00']],
            tue: [['10:00', '14:00'], ['14:45', '19:00']],
            wed: [],
            thu: [['10:00', '14:00'], ['14:45', '19:00']],
            fri: [['10:00', '14:00'], ['14:45', '19:00']],
            sat: [['10:00', '16:00']],
            sun: []
          },
          faqs: [
            { q: 'Do you take walk-ins?', a: 'Yes, subject to availability.' },
            { q: 'Is the $29 special available?', a: 'Yes — consult, exam and adjustment.' }
          ],
          brand: { primaryColor: '#0EA5E9', logoUrl: '' },
          selectedCalendarId: 'primary'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Activate bot
      const activateRes = await axios.post(
        `${API_URL}/api/onboarding/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult({ type: 'success', data: activateRes.data });
    } catch (error: any) {
      setResult({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '16px',
    maxWidth: '800px',
    margin: '0 auto 16px'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px',
    marginBottom: '8px'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
          Healthcare Bot Onboarding
        </h1>

        {/* Auth Section */}
        {!token && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              Step 1: Register/Login
            </h2>
            <input
              style={inputStyle}
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
            <input
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              style={loading ? disabledButtonStyle : buttonStyle}
              onClick={handleAuth}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Register/Login'}
            </button>
          </div>
        )}

        {/* Configuration Section */}
        {token && (
          <>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Step 2: Business Details
              </h2>
              <input
                style={inputStyle}
                type="text"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                style={inputStyle}
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Step 3: Connect Google Calendar
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Connect your Google account to enable calendar booking and Gmail notifications.
              </p>
              <button style={buttonStyle} onClick={connectGoogle}>
                Connect Google Calendar + Gmail
              </button>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                Step 4: Activate Bot
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                This will save your configuration and send it to n8n for bot activation.
              </p>
              <button
                style={loading ? disabledButtonStyle : buttonStyle}
                onClick={saveAndActivate}
                disabled={loading}
              >
                {loading ? 'Activating...' : 'Save Configuration & Activate Bot'}
              </button>
            </div>
          </>
        )}

        {/* Results */}
        {result && (
          <div style={{
            ...cardStyle,
            backgroundColor: result.type === 'error' ? '#fef2f2' : '#f0f9ff',
            border: `1px solid ${result.type === 'error' ? '#fecaca' : '#bfdbfe'}`
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              {result.type === 'error' ? 'Error' : 'Result'}
            </h2>
            {result.type === 'error' ? (
              <p style={{ color: '#dc2626' }}>{result.message}</p>
            ) : (
              <div>
                {result.data.chatLink && (
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Chat Link:</strong>
                    <br />
                    <a href={result.data.chatLink} style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                      {result.data.chatLink}
                    </a>
                  </div>
                )}
                {result.data.embedSnippet && (
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Website Embed Code:</strong>
                    <pre style={{
                      backgroundColor: '#f3f4f6',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {result.data.embedSnippet}
                    </pre>
                  </div>
                )}
                {result.data.payload && (
                  <div>
                    <strong>n8n Payload Sent:</strong>
                    <pre style={{
                      backgroundColor: '#f3f4f6',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      overflow: 'auto',
                      maxHeight: '300px'
                    }}>
                      {JSON.stringify(result.data.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Backend */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Backend Status
          </h2>
          <button
            style={buttonStyle}
            onClick={() => {
              axios.get(`${API_URL}/health`)
                .then(res => setResult({ type: 'success', data: res.data }))
                .catch(err => setResult({ type: 'error', message: err.message }));
            }}
          >
            Test Backend Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboarding;
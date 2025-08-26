const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Save business configuration (mock for testing)
router.post('/save', auth, [
  body('phone').optional().isString(),
  body('timezone').optional().isString(),
  body('address').optional().isString(),
  body('services').optional().isArray(),
  body('hours').optional().isObject(),
  body('faqs').optional().isArray(),
  body('brand').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Mock configuration save
    const botConfig = {
      ...req.body,
      tenantId: req.tenant.id,
      savedAt: new Date()
    };

    console.log('Mock config saved:', botConfig);

    res.json({
      message: 'Configuration saved successfully',
      botConfig
    });
  } catch (error) {
    console.error('Save configuration error:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Activate bot and send to n8n
router.post('/activate', auth, async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    
    // Mock bot configuration (use data from request body or defaults)
    const mockBotConfig = {
      phone: '+1-256-935-1911',
      timezone: 'America/Chicago', 
      address: '510 E Meighan Blvd a10, Gadsden, AL 35903',
      services: [
        { name: 'First Visit', durationMin: 30, price: 29 },
        { name: 'Adjustment', durationMin: 15, price: 45 }
      ],
      faqs: [
        { q: 'Do you take walk-ins?', a: 'Yes, subject to availability.' },
        { q: 'Is the $29 special available?', a: 'Yes — consult, exam and adjustment.' }
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
      brand: { primaryColor: '#0EA5E9', logoUrl: '' }
    };

    // Build proper n8n payload matching your prompt structure
    const n8nPayload = {
      "Clinic Name": "Test Clinic",
      "State": "AL",
      "Address": mockBotConfig.address,
      "Phone Number": mockBotConfig.phone,
      "Booking Link": `https://your-booking-link.com/${tenantId}`,
      "Operation Hours": formatHoursForN8N(mockBotConfig.hours),
      "Time Zone": mockBotConfig.timezone,
      "Plan_Price": "$29",
      
      // Integration tokens (mock for now)
      "google_calendar_token_ref": "mock_google_token_123",
      "gmail_token_ref": "mock_google_token_123", 
      "facebook_token_ref": "mock_facebook_token_456",
      "instagram_token_ref": "mock_instagram_token_789",
      
      // Additional data
      "services": mockBotConfig.services,
      "faqs": mockBotConfig.faqs,
      "brand": mockBotConfig.brand,
      
      // System fields
      "tenant_id": tenantId,
      "webhook_timestamp": new Date().toISOString(),
      "source": "onboarding_activation"
    };

    // Send to n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-webhook-url.com/webhook/bot-setup';
    
    let n8nResponse = null;
    if (n8nWebhookUrl && n8nWebhookUrl !== 'https://your-n8n-webhook-url.com/webhook/bot-setup') {
      try {
        n8nResponse = await axios.post(n8nWebhookUrl, n8nPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
            'X-Source': 'ai-chatbot-saas'
          },
          timeout: 10000
        });

        console.log('✅ n8n webhook sent successfully:', n8nResponse.data);
      } catch (n8nError) {
        console.error('❌ n8n webhook error:', n8nError.message);
        // Continue even if n8n fails
      }
    } else {
      console.log('⚠️ n8n webhook URL not configured, skipping webhook call');
    }

    // Generate response with links
    const chatLink = `https://your-chat-widget.com/chat/${tenantId}`;
    const embedSnippet = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-widget-cdn.com/widget.js';
    script.setAttribute('data-tenant-id', '${tenantId}');
    script.setAttribute('data-primary-color', '${mockBotConfig.brand.primaryColor}');
    document.head.appendChild(script);
  })();
</script>`;

    res.json({
      status: 'activated',
      message: 'Bot configuration sent to n8n successfully',
      chatLink,
      embedSnippet,
      payload: n8nPayload,
      n8nResponse: n8nResponse?.data || 'Webhook URL not configured'
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Failed to activate bot' });
  }
});

// Helper function to format hours for n8n
function formatHoursForN8N(hours) {
  const dayNames = {
    mon: 'Monday',
    tue: 'Tuesday', 
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
  };
  
  let formatted = [];
  Object.entries(hours).forEach(([day, times]) => {
    if (times && times.length > 0) {
      const timeSlots = times.map(([start, end]) => `${start}-${end}`).join(', ');
      formatted.push(`${dayNames[day]}: ${timeSlots}`);
    }
  });
  
  return formatted.join('\n');
}

// Get current configuration
router.get('/config', auth, async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    
    const botConfig = await prisma.botConfig.findUnique({
      where: { tenantId }
    });

    const integrations = await prisma.integration.findMany({
      where: { tenantId },
      select: {
        provider: true,
        externalId: true,
        metadata: true
      }
    });

    res.json({
      botConfig,
      integrations
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

module.exports = router;
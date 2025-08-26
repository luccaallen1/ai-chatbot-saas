const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Save business configuration
router.post('/save', auth, [
  body('phone').optional().isMobilePhone(),
  body('timezone').optional().isString(),
  body('address').optional().isString(),
  body('services').optional().isArray(),
  body('hours').optional().isObject(),
  body('faqs').optional().isArray(),
  body('brand').optional().isObject(),
  body('flags').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, timezone, address, services, hours, faqs, brand, flags, selectedCalendarId } = req.body;
    const tenantId = req.tenant.id;

    // Upsert bot configuration
    const botConfig = await prisma.botConfig.upsert({
      where: { tenantId },
      update: {
        phone,
        timezone,
        address,
        services: services || [],
        hours: hours || {},
        faqs: faqs || [],
        brand: brand || {},
        flags: flags || {}
      },
      create: {
        tenantId,
        phone,
        timezone: timezone || 'America/Chicago',
        address,
        services: services || [],
        hours: hours || {},
        faqs: faqs || [],
        brand: brand || {},
        flags: flags || {}
      }
    });

    // Update Google integration with selected calendar
    if (selectedCalendarId) {
      await prisma.integration.updateMany({
        where: {
          tenantId,
          provider: 'google'
        },
        data: {
          metadata: {
            calendarId: selectedCalendarId
          }
        }
      });
    }

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
    
    // Get bot configuration
    const botConfig = await prisma.botConfig.findUnique({
      where: { tenantId }
    });

    if (!botConfig) {
      return res.status(400).json({ error: 'Please save configuration first' });
    }

    // Get all integrations
    const integrations = await prisma.integration.findMany({
      where: { tenantId }
    });

    // Check for required integrations
    const googleIntegration = integrations.find(i => i.provider === 'google');
    if (!googleIntegration || !googleIntegration.metadata?.calendarId) {
      return res.status(400).json({ error: 'Google Calendar not configured' });
    }

    // Build n8n payload
    const n8nPayload = {
      tenant_id: tenantId,
      bot: {
        phone: botConfig.phone || '+1-256-935-1911',
        timezone: botConfig.timezone || 'America/Chicago',
        address: botConfig.address || '510 E Meighan Blvd a10, Gadsden, AL 35903',
        services: botConfig.services || [
          { name: 'First Visit', durationMin: 30, price: 29 },
          { name: 'Adjustment', durationMin: 15, price: 45 }
        ],
        faqs: botConfig.faqs || [
          { q: 'Do you take walk-ins?', a: 'Yes, subject to availability.' },
          { q: 'Is the $29 special available?', a: 'Yes — consult, exam and adjustment.' }
        ],
        hours: botConfig.hours || {
          mon: [['10:00', '14:00'], ['14:45', '19:00']],
          tue: [['10:00', '14:00'], ['14:45', '19:00']],
          wed: [],
          thu: [['10:00', '14:00'], ['14:45', '19:00']],
          fri: [['10:00', '14:00'], ['14:45', '19:00']],
          sat: [['10:00', '16:00']],
          sun: []
        },
        brand: botConfig.brand || {
          primaryColor: '#0EA5E9',
          logoUrl: 'https://cdn/brand/logo.png'
        },
        chatLinkBase: `${process.env.CLIENT_URL}/chat/${tenantId}`
      },
      integrations: {},
      routing: {
        srcTags: ['Website', 'Facebook', 'Instagram', 'SMS', 'Email'],
        bookingPolicy: 'first_available'
      }
    };

    // Add integration token refs
    integrations.forEach(int => {
      if (int.provider === 'google') {
        n8nPayload.integrations.google = {
          calendarId: int.metadata?.calendarId || 'primary',
          tokenRef: int.tokenRef
        };
        // Gmail uses same Google token
        n8nPayload.integrations.gmail = {
          tokenRef: int.tokenRef
        };
      } else if (int.provider === 'facebook') {
        n8nPayload.integrations.facebook = {
          pageId: int.externalId,
          tokenRef: int.tokenRef
        };
      } else if (int.provider === 'instagram') {
        n8nPayload.integrations.instagram = {
          igBusinessId: int.externalId,
          tokenRef: int.tokenRef
        };
      }
    });

    // Send to n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (n8nWebhookUrl) {
      try {
        const n8nResponse = await axios.post(n8nWebhookUrl, n8nPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          }
        });

        console.log('n8n activation response:', n8nResponse.data);
      } catch (n8nError) {
        console.error('n8n webhook error:', n8nError);
        // Continue even if n8n fails
      }
    }

    // Generate response with links
    const chatLink = `${process.env.CLIENT_URL}/chat/${tenantId}?src=direct`;
    const embedSnippet = `<script async src="${process.env.API_URL}/widget.js"></script>
<div id="tt-chat" data-tenant="${tenantId}"></div>`;

    res.json({
      status: 'activated',
      n8nRequestId: Date.now().toString(),
      chatLink,
      embedSnippet,
      payload: n8nPayload // Include payload for debugging
    });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Failed to activate bot' });
  }
});

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
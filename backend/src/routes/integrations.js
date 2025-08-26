const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Uppile configuration
const UPPILE_TOKEN = process.env.UPPILE_TOKEN || '0T8j7UMW.IpjHizK58VQPPRQMRG3bSrQldoLavQebTqwH5JuEAns=';
const UPPILE_API = 'https://api.uppile.com/v1';

// OAuth scopes per provider
const PROVIDER_SCOPES = {
  google: [
    'openid',
    'email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send'
  ],
  facebook: [
    'pages_show_list',
    'pages_manage_metadata',
    'pages_messaging',
    'pages_read_engagement'
  ],
  instagram: [
    'instagram_basic',
    'instagram_manage_messages'
  ]
};

// Start OAuth flow with Uppile
router.get('/:provider/start', auth, async (req, res) => {
  try {
    const { provider } = req.params;
    const tenantId = req.tenant.id;
    
    if (!PROVIDER_SCOPES[provider]) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Build Uppile auth URL
    const authUrl = `${UPPILE_API}/oauth/authorize`;
    const params = new URLSearchParams({
      client_token: UPPILE_TOKEN,
      provider,
      scopes: PROVIDER_SCOPES[provider].join(','),
      state: tenantId, // Pass tenant ID in state
      redirect_uri: `${process.env.API_URL}/api/integrations/${provider}/callback`
    });

    res.redirect(`${authUrl}?${params}`);
  } catch (error) {
    console.error('OAuth start error:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

// Handle OAuth callback from Uppile
router.get('/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state: tenantId } = req.query;

    if (!code || !tenantId) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    // Exchange code for token with Uppile
    const tokenResponse = await axios.post(`${UPPILE_API}/oauth/token`, {
      client_token: UPPILE_TOKEN,
      code,
      provider
    });

    const { token_ref, external_id, scopes, metadata } = tokenResponse.data;

    // Store integration in database
    await prisma.integration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider
        }
      },
      update: {
        tokenRef: token_ref,
        externalId: external_id,
        scopes,
        metadata: metadata || {}
      },
      create: {
        tenantId,
        provider,
        tokenRef: token_ref,
        externalId: external_id,
        scopes,
        metadata: metadata || {}
      }
    });

    // Handle provider-specific data
    if (provider === 'google' && metadata?.calendars) {
      // Store available calendars in metadata
      await prisma.integration.update({
        where: { id: token_ref },
        data: {
          metadata: {
            ...metadata,
            calendars: metadata.calendars
          }
        }
      });
    }

    // Redirect to frontend with success
    res.redirect(`${process.env.CLIENT_URL}/onboarding?integration=${provider}&status=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/onboarding?integration=${provider}&status=error`);
  }
});

// Get integration status for tenant
router.get('/status', auth, async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: req.tenant.id },
      select: {
        provider: true,
        externalId: true,
        scopes: true,
        metadata: true,
        createdAt: true
      }
    });

    const status = {
      google: null,
      facebook: null,
      instagram: null,
      gmail: null
    };

    integrations.forEach(int => {
      status[int.provider] = {
        connected: true,
        externalId: int.externalId,
        metadata: int.metadata,
        connectedAt: int.createdAt
      };
    });

    res.json(status);
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

// Token resolver for n8n (server-to-server)
router.get('/token', async (req, res) => {
  try {
    const { ref } = req.query;
    const apiKey = req.header('X-API-Key');

    // Validate API key (you should implement proper API key validation)
    if (apiKey !== process.env.N8N_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!ref) {
      return res.status(400).json({ error: 'Token reference required' });
    }

    // Get integration from database
    const integration = await prisma.integration.findUnique({
      where: { tokenRef: ref }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Call Uppile to get fresh access token
    const tokenResponse = await axios.get(`${UPPILE_API}/tokens/${ref}/access`, {
      headers: {
        'Authorization': `Bearer ${UPPILE_TOKEN}`
      }
    });

    const { access_token, expires_at } = tokenResponse.data;

    res.json({
      access_token,
      expires_at,
      provider: integration.provider
    });
  } catch (error) {
    console.error('Token resolver error:', error);
    res.status(500).json({ error: 'Failed to resolve token' });
  }
});

// Disconnect integration
router.delete('/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;
    
    await prisma.integration.delete({
      where: {
        tenantId_provider: {
          tenantId: req.tenant.id,
          provider
        }
      }
    });

    res.json({ message: `${provider} disconnected successfully` });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

module.exports = router;
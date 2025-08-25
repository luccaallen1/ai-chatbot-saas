const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, subscriptionAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Get all widgets for user
router.get('/', auth, async (req, res) => {
  try {
    const widgets = await prisma.widget.findMany({
      where: { userId: req.user.id },
      include: {
        _count: {
          select: {
            conversations: true,
            analytics: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(widgets);
  } catch (error) {
    console.error('Get widgets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get widget by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const widget = await prisma.widget.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: {
        _count: {
          select: {
            conversations: true,
            analytics: true
          }
        }
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    res.json(widget);
  } catch (error) {
    console.error('Get widget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new widget
router.post('/', auth, subscriptionAuth(), [
  body('name').trim().isLength({ min: 1 }).withMessage('Widget name is required'),
  body('description').optional().trim(),
  body('config').optional().isObject().withMessage('Config must be an object'),
  body('webhookUrl').optional().isURL().withMessage('Webhook URL must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check widget limits based on subscription
    const userWidgets = await prisma.widget.count({
      where: { userId: req.user.id }
    });

    const limits = {
      TRIAL: 1,
      STARTER: 3,
      PROFESSIONAL: 10,
      ENTERPRISE: 50
    };

    if (userWidgets >= limits[req.user.subscriptionPlan]) {
      return res.status(403).json({ 
        error: `Widget limit reached for ${req.user.subscriptionPlan} plan. Upgrade to create more widgets.` 
      });
    }

    const { name, description, config, webhookUrl } = req.body;

    const defaultConfig = {
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px'
      },
      behavior: {
        greeting: 'Hello! How can I help you today?',
        placeholder: 'Type your message...',
        position: 'bottom-right',
        minimized: false
      },
      ai: {
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7
      }
    };

    const widget = await prisma.widget.create({
      data: {
        userId: req.user.id,
        name,
        description,
        config: config || defaultConfig,
        webhookUrl,
        apiKey: uuidv4()
      }
    });

    res.status(201).json({
      message: 'Widget created successfully',
      widget
    });
  } catch (error) {
    console.error('Create widget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update widget
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Widget name is required'),
  body('description').optional().trim(),
  body('config').optional().isObject().withMessage('Config must be an object'),
  body('webhookUrl').optional().isURL().withMessage('Webhook URL must be valid'),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const widget = await prisma.widget.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const { name, description, config, webhookUrl, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (config !== undefined) updateData.config = config;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedWidget = await prisma.widget.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      message: 'Widget updated successfully',
      widget: updatedWidget
    });
  } catch (error) {
    console.error('Update widget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete widget
router.delete('/:id', auth, async (req, res) => {
  try {
    const widget = await prisma.widget.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    await prisma.widget.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Widget deleted successfully' });
  } catch (error) {
    console.error('Delete widget error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate API key
router.post('/:id/regenerate-key', auth, async (req, res) => {
  try {
    const widget = await prisma.widget.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const updatedWidget = await prisma.widget.update({
      where: { id: req.params.id },
      data: { apiKey: uuidv4() }
    });

    res.json({
      message: 'API key regenerated successfully',
      apiKey: updatedWidget.apiKey
    });
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get widget embed code
router.get('/:id/embed', auth, async (req, res) => {
  try {
    const widget = await prisma.widget.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${process.env.WIDGET_CDN_URL || 'http://localhost:5000'}/widget.js';
    script.setAttribute('data-widget-id', '${widget.id}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

    res.json({
      embedCode,
      widgetId: widget.id,
      instructions: [
        "Copy the embed code above",
        "Paste it into your website's HTML, preferably before the closing </body> tag",
        "The widget will automatically load and display on your site"
      ]
    });
  } catch (error) {
    console.error('Get embed code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
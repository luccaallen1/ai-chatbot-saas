const express = require('express');
const { body, validationResult } = require('express-validator');
const widgetService = require('../services/widgetService');

const router = express.Router();

// Handle chat messages from widget
router.post('/widgets/:widgetId/chat', [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('sessionId').trim().isLength({ min: 1 }).withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { widgetId } = req.params;
    const { message, sessionId } = req.body;

    const result = await widgetService.processMessage(widgetId, message, sessionId);
    
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: 'Sorry, I encountered an error. Please try again later.'
    });
  }
});

module.exports = router;
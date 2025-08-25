const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class WidgetService {
  // Get public widget configuration (for CDN)
  async getPublicConfig(widgetId) {
    const widget = await prisma.widget.findUnique({
      where: { 
        id: widgetId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        config: true,
        webhookUrl: true,
        user: {
          select: {
            subscriptionStatus: true
          }
        }
      }
    });

    if (!widget || widget.user.subscriptionStatus === 'CANCELED') {
      throw new Error('Widget not found or inactive');
    }

    // Return sanitized config for public use
    return {
      id: widget.id,
      name: widget.name,
      config: widget.config,
      apiEndpoint: `${process.env.WIDGET_CDN_URL || 'http://localhost:5000'}/api/v1/widgets/${widget.id}/chat`,
      webhookUrl: widget.webhookUrl
    };
  }

  // Generate dynamic widget JavaScript
  getWidgetScript() {
    return `
(function() {
  'use strict';
  
  // Get widget configuration from script tag
  const scriptTag = document.currentScript;
  const widgetId = scriptTag.getAttribute('data-widget-id');
  
  if (!widgetId) {
    console.error('AI Chatbot: Widget ID not provided');
    return;
  }

  // Widget state
  let isLoaded = false;
  let isMinimized = true;
  let widgetConfig = null;
  let chatMessages = [];
  let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Load widget configuration
  async function loadConfig() {
    try {
      const response = await fetch(\`${process.env.WIDGET_CDN_URL || 'http://localhost:5000'}/widget/\${widgetId}/config\`);
      if (!response.ok) throw new Error('Failed to load widget config');
      
      widgetConfig = await response.json();
      initializeWidget();
    } catch (error) {
      console.error('AI Chatbot: Failed to load configuration', error);
    }
  }

  // Create widget HTML structure
  function createWidgetHTML() {
    const config = widgetConfig.config;
    const theme = config.theme || {};
    const behavior = config.behavior || {};
    
    return \`
      <div id="ai-chatbot-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: \${theme.fontFamily || 'Inter, sans-serif'};
      ">
        <!-- Minimized Button -->
        <div id="chatbot-toggle" style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: \${theme.primaryColor || '#007bff'};
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        " onclick="toggleWidget()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        <!-- Chat Interface -->
        <div id="chatbot-interface" style="
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: \${theme.borderRadius || '8px'};
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          display: none;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            padding: 16px;
            background: \${theme.primaryColor || '#007bff'};
            color: white;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <span>\${widgetConfig.name || 'AI Assistant'}</span>
            <button onclick="toggleWidget()" style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              padding: 4px;
            ">✕</button>
          </div>

          <!-- Messages -->
          <div id="chatbot-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          ">
            <div class="bot-message" style="
              background: #f8f9fa;
              padding: 12px;
              border-radius: 8px;
              max-width: 85%;
              align-self: flex-start;
            ">
              \${behavior.greeting || 'Hello! How can I help you today?'}
            </div>
          </div>

          <!-- Input -->
          <div style="
            padding: 16px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 8px;
          ">
            <input 
              id="chatbot-input" 
              type="text" 
              placeholder="\${behavior.placeholder || 'Type your message...'}"
              style="
                flex: 1;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 8px 12px;
                outline: none;
              "
              onkeypress="handleKeyPress(event)"
            />
            <button onclick="sendMessage()" style="
              background: \${theme.primaryColor || '#007bff'};
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              cursor: pointer;
            ">Send</button>
          </div>
        </div>
      </div>
    \`;
  }

  // Initialize widget
  function initializeWidget() {
    if (isLoaded) return;
    
    const widgetHTML = createWidgetHTML();
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // Add global functions
    window.toggleWidget = function() {
      const toggle = document.getElementById('chatbot-toggle');
      const interface = document.getElementById('chatbot-interface');
      
      if (isMinimized) {
        toggle.style.display = 'none';
        interface.style.display = 'flex';
        isMinimized = false;
      } else {
        toggle.style.display = 'flex';
        interface.style.display = 'none';
        isMinimized = true;
      }
    };

    window.handleKeyPress = function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    };

    window.sendMessage = async function() {
      const input = document.getElementById('chatbot-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add user message to chat
      addMessage(message, 'user');
      input.value = '';
      
      try {
        // Send to API
        const response = await fetch(widgetConfig.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            widgetId
          })
        });
        
        const data = await response.json();
        
        if (data.response) {
          addMessage(data.response, 'bot');
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    };

    function addMessage(message, sender) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const messageDiv = document.createElement('div');
      
      const isBot = sender === 'bot';
      messageDiv.className = isBot ? 'bot-message' : 'user-message';
      messageDiv.style.cssText = \`
        background: \${isBot ? '#f8f9fa' : (widgetConfig.config.theme?.primaryColor || '#007bff')};
        color: \${isBot ? '#333' : 'white'};
        padding: 12px;
        border-radius: 8px;
        max-width: 85%;
        align-self: \${isBot ? 'flex-start' : 'flex-end'};
        word-wrap: break-word;
      \`;
      
      messageDiv.textContent = message;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    isLoaded = true;
  }

  // Load configuration and initialize
  loadConfig();
})();`;
  }

  // Process chat message
  async processMessage(widgetId, message, sessionId) {
    try {
      const widget = await prisma.widget.findUnique({
        where: { id: widgetId },
        include: { user: true }
      });

      if (!widget || !widget.isActive) {
        throw new Error('Widget not found or inactive');
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findUnique({
        where: { sessionId }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            widgetId,
            userId: widget.userId,
            sessionId,
            visitorInfo: {}
          }
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message,
          role: 'USER',
          messageType: 'TEXT'
        }
      });

      // Generate AI response (simplified for now)
      const aiResponse = await this.generateAIResponse(message, widget.config);

      // Save AI message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: aiResponse,
          role: 'ASSISTANT',
          messageType: 'TEXT',
          aiModel: widget.config.ai?.model || 'gpt-3.5-turbo'
        }
      });

      // Update conversation statistics
      await prisma.widget.update({
        where: { id: widgetId },
        data: {
          totalMessages: { increment: 2 },
          totalConversations: conversation.startedAt === conversation.updatedAt ? { increment: 1 } : undefined
        }
      });

      return { response: aiResponse };
    } catch (error) {
      console.error('Process message error:', error);
      throw error;
    }
  }

  // Simple AI response generator (replace with OpenAI integration)
  async generateAIResponse(message, config) {
    // This is a placeholder - in production, integrate with OpenAI
    const responses = [
      "I understand your question. Let me help you with that.",
      "That's a great question! Here's what I can tell you:",
      "I'd be happy to assist you with that.",
      "Thanks for reaching out. Here's how I can help:",
      "Let me provide you with some information about that."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + " (Note: This is a demo response. Connect OpenAI for AI-powered responses.)";
  }
}

module.exports = new WidgetService();
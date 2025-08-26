const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      isEmailVerified: true,
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE'
    }
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create a sample widget for the demo user
  const widget = await prisma.widget.upsert({
    where: { id: 'demo-widget-001' },
    update: {},
    create: {
      id: 'demo-widget-001',
      userId: demoUser.id,
      name: 'Customer Support Bot',
      description: 'AI-powered customer support assistant',
      config: {
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '12px'
        },
        behavior: {
          greeting: 'Hello! I\'m here to help. How can I assist you today?',
          placeholder: 'Type your message...',
          position: 'bottom-right',
          minimized: true
        },
        ai: {
          model: 'gpt-3.5-turbo',
          maxTokens: 500,
          temperature: 0.7,
          systemPrompt: 'You are a helpful customer support assistant. Be friendly, professional, and concise.'
        }
      },
      isActive: true
    }
  });

  console.log('✅ Created demo widget:', widget.name);

  // Create sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      widgetId: widget.id,
      userId: demoUser.id,
      sessionId: 'demo-session-001',
      visitorInfo: {
        browser: 'Chrome',
        os: 'Windows',
        country: 'United States'
      }
    }
  });

  console.log('✅ Created sample conversation');

  // Create sample messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        content: 'Hello, I need help with my order',
        role: 'USER',
        messageType: 'TEXT'
      },
      {
        conversationId: conversation.id,
        content: 'I\'d be happy to help you with your order! Could you please provide your order number?',
        role: 'ASSISTANT',
        messageType: 'TEXT',
        aiModel: 'gpt-3.5-turbo',
        aiTokens: 25
      }
    ]
  });

  console.log('✅ Created sample messages');

  // Create sample analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.analytics.upsert({
    where: {
      widgetId_date: {
        widgetId: widget.id,
        date: today
      }
    },
    update: {},
    create: {
      widgetId: widget.id,
      date: today,
      conversations: 5,
      messages: 23,
      uniqueVisitors: 3,
      avgResponseTime: 1.2,
      satisfactionScore: 4.5
    }
  });

  console.log('✅ Created sample analytics');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
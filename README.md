# 🏥 Healthcare Appointment Booking Bot

A specialized AI chatbot platform for healthcare clinics to handle appointment bookings, integrate with Google Calendar, and manage patient interactions through multiple channels.

## 🏗️ Architecture

```
ai-chatbot-saas/
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/        # Database schema and migrations
│   └── package.json
├── dashboard/         # React dashboard for customers
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── widget/           # Enhanced chatbot widget (from existing project)
│   ├── src/
│   └── build/
└── docs/             # Documentation and guides
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for caching)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Dashboard Setup
```bash
cd dashboard
npm install
npm run dev
```

## 📊 Features

### Core Platform
- [x] Multi-tenant architecture
- [x] User authentication & authorization
- [x] Widget configuration management
- [x] Real-time analytics
- [x] Webhook management

### Widget Capabilities
- [x] Dynamic theming & branding
- [x] AI-powered conversations (GPT-4o)
- [x] Voice integration
- [x] File upload support
- [x] Mobile-responsive design

### Dashboard Features
- [x] Visual widget builder
- [x] Live preview
- [x] Analytics dashboard
- [x] Code snippet generation
- [x] Team collaboration

## 🎯 Roadmap

### Phase 1: Foundation (Weeks 1-4) ✅
- Backend API infrastructure
- Database schema
- Basic authentication
- Widget configuration endpoints

### Phase 2: Dashboard (Weeks 5-8) 🚧
- React dashboard application
- Widget builder interface
- Live preview system
- Code generation

### Phase 3: Advanced Features (Weeks 9-12) 📅
- Analytics engine
- Webhook management
- Team collaboration
- Billing integration

### Phase 4: Enterprise (Weeks 13-16) 📅
- White-label options
- API access
- Advanced customization
- Enterprise integrations

## 💼 Business Model

### Subscription Tiers
- **Starter**: $29/month - 1 widget, 1K conversations
- **Professional**: $79/month - 5 widgets, 10K conversations  
- **Enterprise**: $199/month - Unlimited widgets, 50K conversations

### Target Markets
- Small-Medium Businesses
- SaaS Companies
- Healthcare Providers
- E-commerce Platforms
- Professional Services

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Auth**: JWT + bcrypt
- **AI**: OpenAI GPT-4o

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form
- **Charts**: Recharts

### Infrastructure
- **Hosting**: Railway/Render
- **CDN**: Cloudflare
- **Storage**: AWS S3
- **Monitoring**: Sentry

## 📈 Success Metrics

### Business KPIs
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Monthly Churn Rate

### Technical KPIs
- API Response Time (<200ms)
- Widget Load Time (<2s)
- Uptime (99.9%)
- Conversation Success Rate (>95%)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

**Built with ❤️ by the AI Chatbot SaaS team**
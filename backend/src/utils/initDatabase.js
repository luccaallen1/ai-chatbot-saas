const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tenants'
    `;
    
    const tableExists = tableCheck[0]?.count > 0;
    
    if (!tableExists) {
      console.log('📦 No tables found, creating database schema...');
      
      try {
        // Try to push schema
        const { stdout, stderr } = await execPromise('npx prisma db push --skip-generate');
        console.log('✅ Database schema created successfully');
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
      } catch (pushError) {
        console.error('⚠️ Failed to push schema:', pushError.message);
        
        // Try direct SQL creation as fallback
        console.log('🔧 Attempting direct SQL table creation...');
        await createTablesDirectly();
      }
    } else {
      console.log('✅ Database tables already exist');
    }
    
    await prisma.$disconnect();
    console.log('🚀 Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️ Server will start but database operations may fail');
    await prisma.$disconnect();
  }
}

async function createTablesDirectly() {
  try {
    // Create tables with raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "tenants_email_key" ON "tenants"("email")
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "bot_configs" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" TEXT NOT NULL,
        "phone" TEXT,
        "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
        "address" TEXT,
        "services" JSONB DEFAULT '[]',
        "hours" JSONB DEFAULT '{}',
        "faqs" JSONB DEFAULT '[]',
        "brand" JSONB DEFAULT '{}',
        "flags" JSONB DEFAULT '{}',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bot_configs_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "bot_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "bot_configs_tenantId_key" ON "bot_configs"("tenantId")
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "integrations" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "externalId" TEXT,
        "tokenRef" TEXT NOT NULL,
        "scopes" TEXT[],
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "integrations_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "integrations_tokenRef_key" ON "integrations"("tokenRef")
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "integrations_tenantId_provider_key" ON "integrations"("tenantId", "provider")
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "source" TEXT,
        "visitorInfo" JSONB DEFAULT '{}',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endedAt" TIMESTAMP(3),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "conversations_sessionId_key" ON "conversations"("sessionId")
    `;
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "conversationId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "messageType" TEXT NOT NULL DEFAULT 'TEXT',
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
      )
    `;
    
    console.log('✅ Tables created successfully with direct SQL');
  } catch (sqlError) {
    console.error('❌ Direct SQL table creation failed:', sqlError.message);
    throw sqlError;
  }
}

module.exports = { initDatabase };
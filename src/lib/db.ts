// Mother OS — Database client (Prisma + libSQL for StackBlitz WebContainers)
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import path from 'path'
import fs from 'fs'

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function createPrismaClient() {
  ensureDataDir()

  const url = process.env.DATABASE_URL || 'file:./data/mother.db'

  // PrismaLibSQL accepts the libsql config object directly
  const adapter = new PrismaLibSQL({ url })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Singleton pattern — prevents exhausting connections in Next.js dev hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

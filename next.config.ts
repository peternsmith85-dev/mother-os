import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bind to all interfaces so StackBlitz preview can forward the port
  // On local machine this is still accessed via localhost:4789
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:4789', '*.stackblitz.io', '*.webcontainer.io'],
    },
  },
  // Suppress Prisma + libSQL from being bundled on the client
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', 'prisma'],
}

export default nextConfig

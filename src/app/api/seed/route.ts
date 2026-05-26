import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DEMO_TASKS } from '@/lib/utils'

// POST /api/seed — seed demo tasks (dev only)
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const count = await prisma.task.count()
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count })
    }

    await prisma.task.createMany({
      data: DEMO_TASKS.map((t) => ({
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        source: t.source,
        sourceRef: t.sourceRef ?? null,
        tags: JSON.stringify(t.tags),
        proposed: t.proposed,
        parentId: t.parentId ?? null,
        blockedBy: t.blockedBy ?? null,
        blockedSince: t.blockedSince ? new Date(t.blockedSince) : null,
        due: t.due ? new Date(t.due) : null,
        closedAt: t.closedAt ? new Date(t.closedAt) : null,
        reflection: t.reflection ?? null,
        sortOrder: t.sortOrder,
      })),
    })

    const seeded = await prisma.task.count()
    return NextResponse.json({ message: 'Seeded', count: seeded })
  } catch (error) {
    console.error('[seed]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

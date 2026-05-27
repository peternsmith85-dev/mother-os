import { NextResponse } from 'next/server'
import { store } from '@/lib/taskstore'
import { DEMO_TASKS } from '@/lib/utils'

// POST /api/seed — seed demo tasks (no-op if already seeded)
export async function POST() {
  try {
    const count = await store.count()
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count })
    }

    for (const t of DEMO_TASKS) {
      await store.create({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due: t.due,
        source: t.source,
        sourceRef: t.sourceRef,
        tags: t.tags,
        proposed: t.proposed,
        parentId: t.parentId,
        sortOrder: t.sortOrder,
      })
    }

    const seeded = await store.count()
    return NextResponse.json({ message: 'Seeded', count: seeded })
  } catch (error) {
    console.error('[seed]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

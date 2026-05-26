import { NextResponse } from 'next/server'
import { db, ensureSchema, newId } from '@/lib/db'
import { DEMO_TASKS } from '@/lib/utils'

// POST /api/seed — seed demo tasks
export async function POST() {
  try {
    await ensureSchema()

    const countRes = await db.execute('SELECT COUNT(*) as cnt FROM Task')
    const count = Number((countRes.rows[0] as Record<string, unknown>).cnt ?? 0)
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count })
    }

    for (const t of DEMO_TASKS) {
      await db.execute({
        sql: `INSERT INTO Task
          (id, title, description, status, priority, due, source, sourceRef, tags, proposed, parentId, blockedBy, blockedSince, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          newId(),
          t.title,
          t.description ?? null,
          t.status,
          t.priority,
          t.due ?? null,
          t.source,
          t.sourceRef ?? null,
          JSON.stringify(t.tags),
          t.proposed ? 1 : 0,
          t.parentId ?? null,
          t.blockedBy ?? null,
          t.blockedSince ?? null,
          t.sortOrder,
        ],
      })
    }

    const seededRes = await db.execute('SELECT COUNT(*) as cnt FROM Task')
    const seeded = Number((seededRes.rows[0] as Record<string, unknown>).cnt ?? 0)
    return NextResponse.json({ message: 'Seeded', count: seeded })
  } catch (error) {
    console.error('[seed]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

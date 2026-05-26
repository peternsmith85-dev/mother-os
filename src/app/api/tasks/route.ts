import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { InValue } from '@libsql/client'
import { db, ensureSchema, newId } from '@/lib/db'
import { serialiseTask } from '@/lib/utils'

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().optional(),
  status: z
    .enum(['CRITICAL', 'TODAY', 'THIS_WEEK', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'DISCARDED'])
    .default('THIS_WEEK'),
  priority: z.enum(['CRITICAL', 'TODAY', 'THIS_WEEK', 'LATER']).default('THIS_WEEK'),
  due: z.string().datetime().optional().nullable(),
  source: z
    .enum(['EMAIL', 'MEETING', 'MANUAL', 'MOTHER', 'OUTLOOK_PASTE', 'OTHER'])
    .default('MANUAL'),
  sourceRef: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  proposed: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
})

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const proposedFilter = searchParams.get('proposed')

    let sql = 'SELECT * FROM Task WHERE 1=1'
    const args: InValue[] = []

    if (statusFilter) {
      sql += ' AND status = ?'
      args.push(statusFilter)
    } else {
      sql += " AND status != 'DISCARDED'"
    }

    if (proposedFilter !== null) {
      sql += ' AND proposed = ?'
      args.push(proposedFilter === 'true' ? 1 : 0)
    }

    sql += ' ORDER BY sortOrder ASC, createdAt ASC'

    const result = await db.execute({ sql, args })
    const tasks = result.rows.map((r) => serialiseTask(r as Record<string, unknown>))
    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('[tasks GET]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const body = await request.json()
    const parsed = CreateTaskSchema.parse(body)

    // Auto sortOrder = end of that column
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM Task WHERE status = ? AND proposed = ?',
      args: [parsed.status, parsed.proposed ? 1 : 0],
    })
    const sortOrder = parsed.sortOrder ?? Number((countRes.rows[0] as Record<string, unknown>).cnt ?? 0)

    const id = newId()
    await db.execute({
      sql: `INSERT INTO Task
        (id, title, description, status, priority, due, source, sourceRef, tags, proposed, parentId, sortOrder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        parsed.title,
        parsed.description ?? null,
        parsed.status,
        parsed.priority,
        parsed.due ?? null,
        parsed.source,
        parsed.sourceRef ?? null,
        JSON.stringify(parsed.tags),
        parsed.proposed ? 1 : 0,
        parsed.parentId ?? null,
        sortOrder,
      ],
    })

    const row = await db.execute({ sql: 'SELECT * FROM Task WHERE id = ?', args: [id] })
    const task = serialiseTask(row.rows[0] as Record<string, unknown>)
    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error('[tasks POST]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { InValue } from '@libsql/client'
import { db, ensureSchema } from '@/lib/db'
import { serialiseTask } from '@/lib/utils'

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().nullable().optional(),
  status: z
    .enum(['CRITICAL', 'TODAY', 'THIS_WEEK', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'DISCARDED'])
    .optional(),
  priority: z.enum(['CRITICAL', 'TODAY', 'THIS_WEEK', 'LATER']).optional(),
  due: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
  proposed: z.boolean().optional(),
  blockedBy: z.string().nullable().optional(),
  blockedSince: z.string().datetime().nullable().optional(),
  closedAt: z.string().datetime().nullable().optional(),
  reflection: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
})

// GET /api/tasks/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema()
    const { id } = await params
    const result = await db.execute({ sql: 'SELECT * FROM Task WHERE id = ?', args: [id] })
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: serialiseTask(result.rows[0] as Record<string, unknown>) })
  } catch (error) {
    console.error('[tasks/[id] GET]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema()
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateTaskSchema.parse(body)

    // Build SET clause dynamically from provided fields
    const sets: string[] = ['updatedAt = strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\')']
    const args: InValue[] = []

    const fieldMap: Record<string, unknown> = {
      ...parsed,
      tags: parsed.tags !== undefined ? JSON.stringify(parsed.tags) : undefined,
      proposed: parsed.proposed !== undefined ? (parsed.proposed ? 1 : 0) : undefined,
    }

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        sets.push(`${key} = ?`)
        args.push(val as InValue)
      }
    }

    args.push(id)
    await db.execute({
      sql: `UPDATE Task SET ${sets.join(', ')} WHERE id = ?`,
      args,
    })

    const result = await db.execute({ sql: 'SELECT * FROM Task WHERE id = ?', args: [id] })
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: serialiseTask(result.rows[0] as Record<string, unknown>) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error('[tasks/[id] PATCH]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema()
    const { id } = await params
    await db.execute({ sql: "UPDATE Task SET status = 'DISCARDED' WHERE id = ?", args: [id] })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('[tasks/[id] DELETE]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

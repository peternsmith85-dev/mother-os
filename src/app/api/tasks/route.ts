import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { store } from '@/lib/taskstore'

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
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') ?? undefined
    const proposedParam = searchParams.get('proposed')
    const proposedFilter =
      proposedParam === null ? undefined : proposedParam === 'true'

    const tasks = await store.list({
      status: statusFilter,
      proposed: proposedFilter,
      excludeDiscarded: statusFilter === undefined,
    })
    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('[tasks GET]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateTaskSchema.parse(body)
    const task = await store.create(parsed)
    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error('[tasks POST]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

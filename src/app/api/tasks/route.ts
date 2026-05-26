import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
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
  sortOrder: z.number().int().default(0),
})

// GET /api/tasks — list all non-discarded tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const proposedFilter = searchParams.get('proposed')

    const where: Record<string, unknown> = {}
    if (statusFilter) {
      where.status = statusFilter
    } else {
      // Default: exclude discarded
      where.status = { not: 'DISCARDED' }
    }
    if (proposedFilter !== null) {
      where.proposed = proposedFilter === 'true'
    }

    const rows = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ data: rows.map(serialiseTask) })
  } catch (error) {
    console.error('[tasks GET]', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks — create a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateTaskSchema.parse(body)

    // Auto sortOrder = end of that column
    const colCount = await prisma.task.count({
      where: { status: parsed.status, proposed: parsed.proposed },
    })

    const task = await prisma.task.create({
      data: {
        ...parsed,
        tags: JSON.stringify(parsed.tags),
        sortOrder: parsed.sortOrder ?? colCount,
      },
    })

    return NextResponse.json({ data: serialiseTask(task) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    console.error('[tasks POST]', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

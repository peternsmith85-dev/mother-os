import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
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
    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: serialiseTask(task) })
  } catch (error) {
    console.error('[tasks/[id] GET]', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateTaskSchema.parse(body)

    // Serialise tags if present
    const data: Record<string, unknown> = { ...parsed }
    if (parsed.tags !== undefined) {
      data.tags = JSON.stringify(parsed.tags)
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    })

    return NextResponse.json({ data: serialiseTask(task) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 422 })
    }
    // Prisma record not found
    if ((error as { code?: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[tasks/[id] PATCH]', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — soft delete (set status to DISCARDED)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.task.update({
      where: { id },
      data: { status: 'DISCARDED' },
    })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('[tasks/[id] DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

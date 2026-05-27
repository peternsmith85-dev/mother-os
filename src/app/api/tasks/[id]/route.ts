import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { store } from '@/lib/taskstore'

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
    const task = await store.get(id)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: task })
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
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateTaskSchema.parse(body)
    const task = await store.update(id, parsed)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: task })
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
    const { id } = await params
    await store.softDelete(id)
    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('[tasks/[id] DELETE]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

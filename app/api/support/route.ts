import { NextRequest, NextResponse } from 'next/server'
import { listEscalations, getEscalation, resolveEscalation } from '@/lib/support-kv'
import { getSession } from '@/lib/auth'

async function requireAuth() {
    const token = await getSession()
    if (!token) throw new Error('Unauthorized')
    return token
}

// GET — list escalations
export async function GET(request: NextRequest) {
    try { await requireAuth() } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    // Single escalation by ID
    if (id) {
        const esc = await getEscalation(id)
        if (!esc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(esc)
    }

    // List all
    const resolved = status === 'resolved' ? true : status === 'open' ? false : undefined
    const { escalations, total } = await listEscalations({ resolved })

    return NextResponse.json({ escalations, total })
}

// PATCH — resolve an escalation
export async function PATCH(request: NextRequest) {
    try { await requireAuth() } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const success = await resolveEscalation(id)
    if (!success) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ status: 'resolved' })
}

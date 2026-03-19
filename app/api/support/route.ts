import { NextRequest, NextResponse } from 'next/server'
import { listEscalations, getEscalation, resolveEscalation } from '@/lib/support-kv'
import { getSession } from '@/lib/auth'

const isDev = process.env.NODE_ENV === 'development'
const WEB_API = 'http://localhost:3845/api/support/messages'

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

    // In local dev, proxy to the web app since KV isn't shared across processes
    if (isDev) {
        try {
            const { searchParams } = new URL(request.url)
            const status = searchParams.get('status')
            const query = status ? `?status=${status}` : ''
            const res = await fetch(`${WEB_API}${query}`)
            const data = await res.json()
            return NextResponse.json(data)
        } catch {
            return NextResponse.json({ escalations: [], total: 0 })
        }
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    if (id) {
        const esc = await getEscalation(id)
        if (!esc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(esc)
    }

    const resolved = status === 'resolved' ? true : status === 'open' ? false : undefined
    const { escalations, total } = await listEscalations({ resolved })

    return NextResponse.json({ escalations, total })
}

// PATCH — resolve an escalation
export async function PATCH(request: NextRequest) {
    try { await requireAuth() } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isDev) {
        try {
            const body = await request.json()
            const res = await fetch(WEB_API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            return NextResponse.json(data)
        } catch {
            return NextResponse.json({ error: 'Failed' }, { status: 500 })
        }
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

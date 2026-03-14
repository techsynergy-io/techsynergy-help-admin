import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

export async function GET() {
    const token = await getSession()
    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    try {
        const client = new GitHubClient(token)
        const user = await client.getUser()
        return NextResponse.json(user)
    } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

// GET /api/articles/content?category=getting-started&slug=platform-overview&branch=main
export async function GET(request: NextRequest) {
    const token = await getSession()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const category = request.nextUrl.searchParams.get('category')
    const slug = request.nextUrl.searchParams.get('slug')
    const branch = request.nextUrl.searchParams.get('branch') || 'main'

    if (!category || !slug) {
        return NextResponse.json({ error: 'category and slug are required' }, { status: 400 })
    }

    try {
        const client = new GitHubClient(token)
        const { content, sha } = await client.getArticle(category, slug, branch)
        return NextResponse.json({ content, sha, category, slug, branch })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 404 })
    }
}

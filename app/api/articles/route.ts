import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

// GET /api/articles?category=getting-started
export async function GET(request: NextRequest) {
    const token = await getSession()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = new GitHubClient(token)
    const category = request.nextUrl.searchParams.get('category')

    try {
        if (category) {
            const articles = await client.listArticles(category)
            return NextResponse.json(articles)
        } else {
            const categories = await client.listCategories()
            // Get article counts for each category
            const withCounts = await Promise.all(
                categories.map(async (cat) => {
                    try {
                        const articles = await client.listArticles(cat.name)
                        return { ...cat, articleCount: articles.length }
                    } catch {
                        return { ...cat, articleCount: 0 }
                    }
                })
            )
            return NextResponse.json(withCounts)
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

// POST /api/articles — create or update article
export async function POST(request: NextRequest) {
    const token = await getSession()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = new GitHubClient(token)
    const body = await request.json()
    const { category, slug, content, sha, branch = 'main', action = 'save' } = body

    try {
        if (action === 'draft') {
            await client.ensureDraftsBranch()
            const result = await client.saveArticle(
                category, slug, content,
                `Draft: update ${slug}`, sha, 'drafts'
            )
            return NextResponse.json({ sha: result.sha, branch: 'drafts' })
        }

        if (action === 'publish') {
            // Save to main directly
            const result = await client.saveArticle(
                category, slug, content,
                `Publish: update ${slug}`, sha, 'main'
            )
            return NextResponse.json({ sha: result.sha, branch: 'main' })
        }

        if (action === 'publish-pr') {
            // Save draft first, then create PR
            await client.ensureDraftsBranch()
            await client.saveArticle(
                category, slug, content,
                `Draft: update ${slug}`, sha, 'drafts'
            )
            const pr = await client.createPublishPR(
                `Publish: ${slug}`,
                `Update article \`${category}/${slug}\` for review.`
            )
            return NextResponse.json({ pr_url: pr.html_url, pr_number: pr.number })
        }

        // Default: save to specified branch
        const result = await client.saveArticle(category, slug, content, `Update ${slug}`, sha, branch)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

// DELETE /api/articles
export async function DELETE(request: NextRequest) {
    const token = await getSession()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = new GitHubClient(token)
    const { category, slug, sha } = await request.json()

    try {
        await client.deleteArticle(category, slug, sha)
        return NextResponse.json({ ok: true })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}

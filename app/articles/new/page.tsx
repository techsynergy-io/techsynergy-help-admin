'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { Suspense } from 'react'
import { serializeFrontmatter } from '@/lib/frontmatter'
import type { Frontmatter } from '@/lib/frontmatter'

const TiptapEditor = dynamic(
    () => import('@/components/TiptapEditor').then(m => ({ default: m.TiptapEditor })),
    { ssr: false, loading: () => <div className="h-[500px] bg-white rounded-xl border border-[#E9EAEB] animate-pulse" /> }
)

type ViewMode = 'editor' | 'markdown' | 'preview'

const TEMPLATE = `# Article Title

**Who this is for:** Freelancers

## What you'll achieve

- First outcome
- Second outcome

## Prerequisites

- Requirement one
- Requirement two

## Steps

### 1. First step

Description of the first step.

### 2. Second step

Description of the second step.

## FAQ

### Common question?

Answer to the question.

## Troubleshooting

### Issue description

**Fix:** How to resolve the issue.

## Related articles

- [Related Article Title](./related-article-slug.md)
`

function NewArticleContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const presetCategory = searchParams.get('category') || ''

    const [category, setCategory] = useState(presetCategory)
    const [slug, setSlug] = useState('')
    const [content, setContent] = useState(TEMPLATE)
    const [rawMarkdown, setRawMarkdown] = useState(TEMPLATE)
    const [frontmatter, setFrontmatter] = useState<Frontmatter>({ audience: 'freelancer' })
    const [categories, setCategories] = useState<{ name: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('editor')

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/auth/me')
            if (!res.ok) { router.push('/login'); return }
            const catRes = await fetch('/api/articles')
            if (catRes.ok) setCategories(await catRes.json())
        }
        load()
    }, [router])

    const handleContentChange = useCallback((md: string) => {
        setContent(md)
        setRawMarkdown(md)
    }, [])

    const handleRawChange = useCallback((md: string) => {
        setRawMarkdown(md)
        setContent(md)
    }, [])

    async function handleCreate(action: 'save' | 'draft') {
        if (!category || !slug) {
            setMessage({ type: 'error', text: 'Category and slug are required.' })
            return
        }

        setSaving(true)
        setMessage(null)
        try {
            const fullContent = serializeFrontmatter(frontmatter, viewMode === 'markdown' ? rawMarkdown : content)
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, slug, content: fullContent, action }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setMessage({ type: 'success', text: action === 'draft' ? 'Draft saved!' : 'Article published!' })
            setTimeout(() => router.push(`/articles/${category}/${slug}`), 1000)
        } catch (err) {
            setMessage({ type: 'error', text: String(err) })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-[#E9EAEB] px-6 py-3">
                <div className="max-w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm text-[#717680] hover:text-[#181d27] transition-colors">
                            ← Dashboard
                        </Link>
                        <span className="text-sm font-medium text-[#181d27]">New Article</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View mode toggle */}
                        <div className="flex items-center bg-[#F5F1DC] rounded-lg p-0.5">
                            {(['editor', 'markdown', 'preview'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer capitalize ${
                                        viewMode === mode
                                            ? 'bg-white text-[#181d27] shadow-sm'
                                            : 'text-[#717680] hover:text-[#535862]'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        <span className="w-px h-6 bg-[#E9EAEB]" />

                        <button
                            onClick={() => handleCreate('draft')}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm border border-[#E9EAEB] text-[#535862] hover:bg-[#F5F1DC] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleCreate('save')}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm bg-[#0046ff] text-white hover:bg-[#001bb7] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? 'Creating...' : 'Publish'}
                        </button>
                    </div>
                </div>
            </header>

            {message && (
                <div className={`px-6 py-3 text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Metadata */}
            <div className="bg-white border-b border-[#E9EAEB] px-6 py-4">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#717680] mb-1.5">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full border border-[#E9EAEB] rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="">Select category...</option>
                                {categories.map((cat) => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.name.replace(/-/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#717680] mb-1.5">
                                Slug <span className="text-[#A4A7AE] font-normal">(URL-friendly name)</span>
                            </label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                placeholder="e.g. how-to-get-started"
                                className="w-full border border-[#E9EAEB] rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#717680] mb-1.5">Audience</label>
                            <select
                                value={frontmatter.audience}
                                onChange={(e) => setFrontmatter({ ...frontmatter, audience: e.target.value as Frontmatter['audience'] })}
                                className="w-full border border-[#E9EAEB] rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="both">Both (Freelancer & Client)</option>
                                <option value="freelancer">Freelancer only</option>
                                <option value="business">Client only</option>
                            </select>
                        </div>
                    </div>
                    {category && slug && (
                        <p className="text-xs text-[#A4A7AE]">
                            Will be saved as: <code className="bg-[#F5F1DC] px-1.5 py-0.5 rounded">{category}/{slug}.md</code>
                        </p>
                    )}
                </div>
            </div>

            {/* Editor / Markdown / Preview */}
            <div className="flex-1 overflow-auto">
                {viewMode === 'editor' && (
                    <div className="max-w-4xl mx-auto px-6 py-6">
                        <TiptapEditor content={content} onChange={handleContentChange} />
                    </div>
                )}

                {viewMode === 'markdown' && (
                    <div className="max-w-4xl mx-auto px-6 py-6">
                        <textarea
                            value={rawMarkdown}
                            onChange={(e) => handleRawChange(e.target.value)}
                            className="w-full min-h-[600px] p-4 bg-white border border-[#E9EAEB] rounded-xl font-mono text-sm text-[#535862] resize-y outline-none focus:border-[#0046ff] transition-colors"
                            spellCheck={false}
                        />
                    </div>
                )}

                {viewMode === 'preview' && (
                    <div className="max-w-4xl mx-auto px-8 py-10">
                        <div className="bg-white rounded-xl border border-[#E9EAEB] p-8">
                            <div className="mb-4 flex items-center gap-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    frontmatter.audience === 'freelancer'
                                        ? 'bg-[#FF8040]/10 text-[#FF8040]'
                                        : frontmatter.audience === 'business'
                                        ? 'bg-[#001BB7]/10 text-[#001BB7]'
                                        : 'bg-[#16a34a]/10 text-[#16a34a]'
                                }`}>
                                    {frontmatter.audience === 'freelancer' ? 'Freelancer' : frontmatter.audience === 'business' ? 'Client' : 'Both'}
                                </span>
                            </div>
                            <article className="help-article">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </article>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function NewArticlePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <NewArticleContent />
        </Suspense>
    )
}

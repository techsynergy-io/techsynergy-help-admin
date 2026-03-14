'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense } from 'react'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

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
    const [categories, setCategories] = useState<{ name: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        async function load() {
            const res = await fetch('/api/auth/me')
            if (!res.ok) { router.push('/login'); return }

            const catRes = await fetch('/api/articles')
            if (catRes.ok) setCategories(await catRes.json())
        }
        load()
    }, [router])

    async function handleCreate(action: 'save' | 'draft') {
        if (!category || !slug) {
            setMessage({ type: 'error', text: 'Category and slug are required.' })
            return
        }

        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, slug, content, action }),
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
        <div className="min-h-screen bg-[#FAFAFA]">
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
            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="bg-white rounded-xl border border-[#E9EAEB] p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#535862] mb-1.5">Category</label>
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
                            <label className="block text-sm font-medium text-[#535862] mb-1.5">
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
                    </div>
                    {category && slug && (
                        <p className="mt-3 text-xs text-[#A4A7AE]">
                            Will be saved as: <code className="bg-[#F5F1DC] px-1.5 py-0.5 rounded">{category}/{slug}.md</code>
                        </p>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="max-w-4xl mx-auto px-6 pb-8" data-color-mode="light">
                <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height={600}
                    preview="live"
                />
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

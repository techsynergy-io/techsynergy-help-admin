'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { parseFrontmatter, serializeFrontmatter } from '@/lib/frontmatter'
import type { Frontmatter } from '@/lib/frontmatter'

const TiptapEditor = dynamic(
    () => import('@/components/TiptapEditor').then(m => ({ default: m.TiptapEditor })),
    { ssr: false, loading: () => <div className="h-[500px] bg-white rounded-xl border border-[#E9EAEB] animate-pulse" /> }
)

type ViewMode = 'editor' | 'markdown' | 'preview'

export default function EditArticle() {
    const params = useParams()
    const router = useRouter()
    const category = params.category as string
    const slug = params.slug as string

    const [content, setContent] = useState('')
    const [frontmatter, setFrontmatter] = useState<Frontmatter>({ audience: 'both' })
    const [sha, setSha] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('editor')
    const [rawMarkdown, setRawMarkdown] = useState('')

    useEffect(() => {
        async function fetchArticle() {
            try {
                const authRes = await fetch('/api/auth/me')
                if (!authRes.ok) { router.push('/login'); return }

                const res = await fetch(`/api/articles/content?category=${category}&slug=${slug}`)
                if (res.ok) {
                    const data = await res.json()
                    const { frontmatter: fm, content: body } = parseFrontmatter(data.content)
                    setFrontmatter(fm)
                    setContent(body)
                    setRawMarkdown(body)
                    setSha(data.sha)
                }
            } catch {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }
        fetchArticle()
    }, [category, slug, router])

    const handleContentChange = useCallback((md: string) => {
        setContent(md)
        setRawMarkdown(md)
    }, [])

    const handleRawChange = useCallback((md: string) => {
        setRawMarkdown(md)
        setContent(md)
    }, [])

    const getFullContent = useCallback(() => {
        return serializeFrontmatter(frontmatter, viewMode === 'markdown' ? rawMarkdown : content)
    }, [frontmatter, content, rawMarkdown, viewMode])

    const save = useCallback(async (action: 'save' | 'draft' | 'publish-pr') => {
        setSaving(true)
        setMessage(null)
        try {
            const fullContent = getFullContent()
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, slug, content: fullContent, sha, action }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            if (action === 'publish-pr') {
                setMessage({ type: 'success', text: `PR created! ${data.pr_url}` })
            } else if (action === 'draft') {
                setMessage({ type: 'success', text: 'Saved as draft on drafts branch.' })
            } else {
                setSha(data.sha)
                setMessage({ type: 'success', text: 'Published to main branch.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: String(err) })
        } finally {
            setSaving(false)
        }
    }, [category, slug, sha, getFullContent])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-[#717680]">Loading article...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-[#E9EAEB] px-6 py-3">
                <div className="max-w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-sm text-[#717680] hover:text-[#181d27] transition-colors">
                            ← Dashboard
                        </Link>
                        <span className="text-[#D5D7DA]">|</span>
                        <span className="text-sm text-[#535862]">
                            <span className="text-[#A4A7AE]">{category}/</span>
                            <span className="font-medium text-[#181d27]">{slug}</span>
                        </span>
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
                            onClick={() => save('draft')}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm border border-[#E9EAEB] text-[#535862] hover:bg-[#F5F1DC] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => save('publish-pr')}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm bg-[#FF8040] text-white hover:bg-[#e67339] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Submit for Review
                        </button>
                        <button
                            onClick={() => save('save')}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-lg text-sm bg-[#0046ff] text-white hover:bg-[#001bb7] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? 'Saving...' : 'Publish'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Status message */}
            {message && (
                <div className={`px-6 py-3 text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Article metadata bar */}
            <div className="bg-white border-b border-[#E9EAEB] px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[#717680]">Audience:</label>
                        <select
                            value={frontmatter.audience}
                            onChange={(e) => setFrontmatter({ ...frontmatter, audience: e.target.value as Frontmatter['audience'] })}
                            className="border border-[#E9EAEB] rounded-lg px-2.5 py-1 text-sm bg-white"
                        >
                            <option value="both">Both (Freelancer & Client)</option>
                            <option value="freelancer">Freelancer only</option>
                            <option value="business">Client only</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#A4A7AE]">Path:</span>
                        <code className="text-xs bg-[#F5F1DC] px-2 py-0.5 rounded">{category}/{slug}.md</code>
                    </div>
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

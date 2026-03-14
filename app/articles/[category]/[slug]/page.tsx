'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function EditArticle() {
    const params = useParams()
    const router = useRouter()
    const category = params.category as string
    const slug = params.slug as string

    const [content, setContent] = useState('')
    const [sha, setSha] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/auth/me')
                if (!res.ok) { router.push('/login'); return }

                // Fetch article content via GitHub API
                const articleRes = await fetch(`/api/articles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, slug, action: 'get' }),
                })

                // If the article endpoint doesn't support GET by slug, fetch directly
                const token = document.cookie // We'll use the API route instead
                // Use a dedicated get endpoint
            } catch {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        // Simpler approach: fetch via a query param
        async function fetchArticle() {
            try {
                const res = await fetch('/api/auth/me')
                if (!res.ok) { router.push('/login'); return }

                const articleRes = await fetch(`/api/articles/content?category=${category}&slug=${slug}`)
                if (articleRes.ok) {
                    const data = await articleRes.json()
                    setContent(data.content)
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

    const save = useCallback(async (action: 'save' | 'draft' | 'publish-pr') => {
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, slug, content, sha, action }),
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
    }, [category, slug, content, sha])

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
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                                showPreview
                                    ? 'bg-[#0046ff] text-white'
                                    : 'bg-[#F5F1DC] text-[#535862] hover:bg-[#E9E5CC]'
                            }`}
                        >
                            {showPreview ? 'Editor' : 'Preview'}
                        </button>

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

            {/* Editor / Preview */}
            <div className="flex-1 overflow-hidden">
                {showPreview ? (
                    <div className="max-w-4xl mx-auto px-8 py-10">
                        <article className="help-article">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </article>
                    </div>
                ) : (
                    <div className="h-full" data-color-mode="light">
                        <MDEditor
                            value={content}
                            onChange={(val) => setContent(val || '')}
                            height="calc(100vh - 120px)"
                            preview="edit"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
    login: string
    avatar_url: string
    name: string
}

interface Category {
    name: string
    path: string
    articleCount: number
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [articles, setArticles] = useState<{ name: string; slug: string; sha: string }[]>([])
    const [loadingArticles, setLoadingArticles] = useState(false)

    useEffect(() => {
        async function init() {
            try {
                const res = await fetch('/api/auth/me')
                if (!res.ok) { router.push('/login'); return }
                setUser(await res.json())

                const catRes = await fetch('/api/articles')
                if (catRes.ok) setCategories(await catRes.json())
            } catch {
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    async function loadArticles(category: string) {
        setSelectedCategory(category)
        setLoadingArticles(true)
        try {
            const res = await fetch(`/api/articles?category=${category}`)
            if (res.ok) setArticles(await res.json())
        } finally {
            setLoadingArticles(false)
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-[#717680]">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Header */}
            <header className="bg-white border-b border-[#E9EAEB] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-[#181d27]">Help Center Admin</h1>
                        <span className="text-xs bg-[#F5F1DC] text-[#717680] px-2 py-0.5 rounded-full">
                            TechSynergy
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/support"
                            className="text-sm text-[#535862] hover:text-[#0046ff] transition-colors"
                        >
                            Support Messages
                        </Link>
                        <Link
                            href="/articles/new"
                            className="bg-[#0046ff] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#001bb7] transition-colors"
                        >
                            + New Article
                        </Link>
                        {user && (
                            <div className="flex items-center gap-3">
                                <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full" />
                                <span className="text-sm text-[#535862]">{user.name || user.login}</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-[#717680] hover:text-[#181d27] transition-colors cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Category List */}
                    <div className="lg:col-span-4">
                        <h2 className="text-sm font-semibold text-[#717680] uppercase tracking-wide mb-4">Categories</h2>
                        <div className="flex flex-col gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => loadArticles(cat.name)}
                                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                                        selectedCategory === cat.name
                                            ? 'bg-white border-[#0046ff] shadow-sm'
                                            : 'bg-white border-[#E9EAEB] hover:border-[#D5D7DA]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[#181d27] capitalize">
                                            {cat.name.replace(/-/g, ' ')}
                                        </span>
                                        <span className="text-xs text-[#717680] bg-[#F5F1DC] px-2 py-0.5 rounded-full">
                                            {cat.articleCount}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Articles List */}
                    <div className="lg:col-span-8">
                        {selectedCategory ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-[#717680] uppercase tracking-wide">
                                        Articles in {selectedCategory.replace(/-/g, ' ')}
                                    </h2>
                                    <Link
                                        href={`/articles/new?category=${selectedCategory}`}
                                        className="text-sm text-[#0046ff] hover:underline"
                                    >
                                        + Add article
                                    </Link>
                                </div>

                                {loadingArticles ? (
                                    <div className="animate-pulse space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 bg-white rounded-xl border border-[#E9EAEB]" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {articles.map((article) => (
                                            <Link
                                                key={article.slug}
                                                href={`/articles/${selectedCategory}/${article.slug}`}
                                                className="p-4 bg-white rounded-xl border border-[#E9EAEB] hover:border-[#D5D7DA] hover:shadow-sm transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-[#181d27] capitalize">
                                                        {article.slug.replace(/-/g, ' ')}
                                                    </span>
                                                    <span className="text-xs text-[#A4A7AE]">
                                                        {selectedCategory}/{article.slug}.md
                                                    </span>
                                                </div>
                                                <span className="text-xs text-[#0046ff] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Edit →
                                                </span>
                                            </Link>
                                        ))}
                                        {articles.length === 0 && (
                                            <p className="text-sm text-[#717680] py-8 text-center">No articles in this category.</p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-[#717680] text-sm">
                                Select a category to view its articles
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

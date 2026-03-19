'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChatMessage {
    role: string
    content: string
}

interface Escalation {
    id: string
    customerEmail?: string
    customerName?: string
    customerPhone?: string
    message: string
    chatHistory?: ChatMessage[]
    aiConfidence: number
    createdAt: string
    resolved: boolean
    resolvedAt?: string
}

export default function SupportMessages() {
    const router = useRouter()
    const [escalations, setEscalations] = useState<Escalation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open')
    const [selected, setSelected] = useState<Escalation | null>(null)
    const [resolving, setResolving] = useState<string | null>(null)

    useEffect(() => {
        loadEscalations()
    }, [filter])

    async function loadEscalations() {
        setLoading(true)
        try {
            const status = filter === 'all' ? '' : `?status=${filter}`
            const res = await fetch(`/api/support${status}`)
            if (!res.ok) {
                if (res.status === 401) { router.push('/login'); return }
                throw new Error()
            }
            const data = await res.json()
            setEscalations(data.escalations || [])
        } catch {
            setEscalations([])
        } finally {
            setLoading(false)
        }
    }

    async function handleResolve(id: string) {
        setResolving(id)
        try {
            await fetch('/api/support', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            setEscalations(prev => prev.filter(e => e.id !== id))
            if (selected?.id === id) setSelected(null)
        } finally {
            setResolving(null)
        }
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Header */}
            <header className="bg-white border-b border-[#E9EAEB] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-lg font-bold text-[#181d27] hover:text-[#0046ff] transition-colors">
                            Help Center Admin
                        </Link>
                        <span className="text-xs bg-[#F5F1DC] text-[#717680] px-2 py-0.5 rounded-full">
                            TechSynergy
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-[#535862] hover:text-[#181d27] transition-colors"
                        >
                            Articles
                        </Link>
                        <span className="text-sm text-[#0046ff] font-medium">
                            Support Messages
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Title + Filter */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-[#181d27]">Support Messages</h1>
                        <p className="text-sm text-[#717680] mt-1">
                            Escalated conversations from the AI support chat
                        </p>
                    </div>
                    <div className="flex gap-1 bg-white border border-[#E9EAEB] rounded-lg p-1">
                        {(['open', 'resolved', 'all'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setSelected(null) }}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer capitalize ${
                                    filter === f
                                        ? 'bg-[#0046ff] text-white'
                                        : 'text-[#535862] hover:bg-[#FAFAFA]'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Message List */}
                    <div className="lg:col-span-5">
                        {loading ? (
                            <div className="bg-white rounded-xl border border-[#E9EAEB] p-8 text-center">
                                <div className="animate-pulse text-[#717680] text-sm">Loading messages...</div>
                            </div>
                        ) : escalations.length === 0 ? (
                            <div className="bg-white rounded-xl border border-[#E9EAEB] p-8 text-center">
                                <p className="text-[#717680] text-sm">
                                    {filter === 'open' ? 'No open escalations' : filter === 'resolved' ? 'No resolved escalations' : 'No escalations yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {escalations.map(esc => (
                                    <button
                                        key={esc.id}
                                        onClick={() => setSelected(esc)}
                                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                                            selected?.id === esc.id
                                                ? 'bg-white border-[#0046ff] shadow-sm'
                                                : 'bg-white border-[#E9EAEB] hover:border-[#D5D7DA]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-[#181d27] truncate">
                                                        {esc.customerName || 'Anonymous'}
                                                    </span>
                                                    {!esc.resolved && (
                                                        <span className="shrink-0 w-2 h-2 bg-[#FF8040] rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#535862] line-clamp-2 mb-2">
                                                    {esc.message}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] text-[#717680]">
                                                    <span>{formatDate(esc.createdAt)}</span>
                                                    {esc.customerEmail && <span>{esc.customerEmail}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-7">
                        {selected ? (
                            <div className="bg-white rounded-xl border border-[#E9EAEB] overflow-hidden">
                                {/* Detail Header */}
                                <div className="px-6 py-4 border-b border-[#E9EAEB]">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-[#181d27]">
                                                {selected.customerName || 'Anonymous'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#717680]">
                                                {selected.customerEmail && (
                                                    <a href={`mailto:${selected.customerEmail}`} className="text-[#0046ff] hover:underline">
                                                        {selected.customerEmail}
                                                    </a>
                                                )}
                                                {selected.customerPhone && (
                                                    <a href={`https://wa.me/${selected.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">
                                                        {selected.customerPhone}
                                                    </a>
                                                )}
                                                <span>{formatDate(selected.createdAt)}</span>
                                            </div>
                                        </div>
                                        {!selected.resolved && (
                                            <button
                                                onClick={() => handleResolve(selected.id)}
                                                disabled={resolving === selected.id}
                                                className="px-4 py-2 bg-[#16A34A] text-white text-xs font-medium rounded-lg hover:bg-[#15803D] transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {resolving === selected.id ? 'Resolving...' : 'Mark Resolved'}
                                            </button>
                                        )}
                                        {selected.resolved && (
                                            <span className="px-3 py-1 bg-[#F0FDF4] text-[#16A34A] text-xs font-medium rounded-full">
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* User's Message */}
                                <div className="px-6 py-4 border-b border-[#E9EAEB] bg-[#FFF8F0]">
                                    <p className="text-xs font-semibold text-[#717680] uppercase tracking-wide mb-2">
                                        Their message
                                    </p>
                                    <p className="text-sm text-[#181d27] leading-relaxed">
                                        {selected.message}
                                    </p>
                                </div>

                                {/* Chat History */}
                                {selected.chatHistory && selected.chatHistory.length > 0 && (
                                    <div className="px-6 py-4">
                                        <p className="text-xs font-semibold text-[#717680] uppercase tracking-wide mb-3">
                                            Chat history before escalation
                                        </p>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                            {selected.chatHistory.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                                        msg.role === 'user'
                                                            ? 'bg-[#0046ff] text-white rounded-br-sm'
                                                            : 'bg-[#F5F5F5] text-[#181d27] rounded-bl-sm'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(!selected.chatHistory || selected.chatHistory.length === 0) && (
                                    <div className="px-6 py-8 text-center">
                                        <p className="text-xs text-[#717680]">No chat history available</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-[#E9EAEB] p-12 text-center">
                                <p className="text-sm text-[#717680]">Select a message to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

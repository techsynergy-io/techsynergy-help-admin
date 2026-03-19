/**
 * Cloudflare KV client for reading support chat escalations.
 * Shared KV namespace: TechSynergy-Help-Centre (SUPPORT_KV binding).
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

export interface Escalation {
    id: string
    customerEmail?: string
    customerName?: string
    customerPhone?: string
    message: string
    chatHistory?: Array<{ role: string; content: string }>
    aiConfidence: number
    aiSources: string[]
    createdAt: string
    resolved: boolean
    resolvedAt?: string
    resolvedBy?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getKV(): Promise<any> {
    try {
        const { env } = await getCloudflareContext()
        return (env as Record<string, unknown>).SUPPORT_KV || null
    } catch {
        return null
    }
}

export async function getEscalation(id: string): Promise<Escalation | null> {
    const kv = await getKV()
    if (!kv) return null
    const raw = await kv.get(`escalation:${id}`)
    return raw ? JSON.parse(raw) : null
}

export async function listEscalations(opts?: {
    resolved?: boolean
    limit?: number
    offset?: number
}): Promise<{ escalations: Escalation[]; total: number }> {
    const kv = await getKV()
    if (!kv) return { escalations: [], total: 0 }

    const indexRaw = await kv.get('escalation_index')
    const allIds: string[] = indexRaw ? JSON.parse(indexRaw) : []

    const all: Escalation[] = []
    for (const id of allIds) {
        const raw = await kv.get(`escalation:${id}`)
        if (raw) all.push(JSON.parse(raw))
    }

    let filtered = all
    if (opts?.resolved !== undefined) {
        filtered = all.filter(e => e.resolved === opts.resolved)
    }

    const total = filtered.length
    const offset = opts?.offset || 0
    const limit = opts?.limit || 50

    return { escalations: filtered.slice(offset, offset + limit), total }
}

export async function resolveEscalation(id: string, resolvedBy?: string): Promise<boolean> {
    const kv = await getKV()
    if (!kv) return false

    const raw = await kv.get(`escalation:${id}`)
    if (!raw) return false

    const esc: Escalation = JSON.parse(raw)
    esc.resolved = true
    esc.resolvedAt = new Date().toISOString()
    if (resolvedBy) esc.resolvedBy = resolvedBy

    await kv.put(`escalation:${esc.id}`, JSON.stringify(esc))
    return true
}

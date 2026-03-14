import { cookies } from 'next/headers'

const SESSION_COOKIE = 'help_admin_session'

// Simple XOR-based encoding (not production crypto, but sufficient for session tokens)
function encode(text: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret'
    return Buffer.from(
        text.split('').map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))
        ).join('')
    ).toString('base64')
}

function decode(encoded: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret'
    const decoded = Buffer.from(encoded, 'base64').toString()
    return decoded.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))
    ).join('')
}

export async function setSession(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, encode(token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })
}

export async function getSession(): Promise<string | null> {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(SESSION_COOKIE)
    if (!cookie) return null
    try {
        return decode(cookie.value)
    } catch {
        return null
    }
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

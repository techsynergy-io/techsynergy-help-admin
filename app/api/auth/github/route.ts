import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GITHUB_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3850'}/api/auth/callback`

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:org`

    return NextResponse.redirect(url)
}

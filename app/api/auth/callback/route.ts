import { NextRequest, NextResponse } from 'next/server'
import { setSession } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
        return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
        return NextResponse.redirect(new URL('/login?error=token_failed', request.url))
    }

    // Verify org membership
    const client = new GitHubClient(tokenData.access_token)
    const user = await client.getUser()
    const isMember = await client.checkOrgMembership(user.login)

    if (!isMember) {
        return NextResponse.redirect(new URL('/login?error=not_member', request.url))
    }

    // Store session
    await setSession(tokenData.access_token)

    return NextResponse.redirect(new URL('/', request.url))
}

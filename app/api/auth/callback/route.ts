import { NextRequest, NextResponse } from 'next/server'
import { setSession } from '@/lib/auth'
import { GitHubClient } from '@/lib/github'

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')
    if (!code) {
        return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    // Debug: check if env vars are available
    if (!clientId || !clientSecret) {
        return NextResponse.json({
            error: 'Missing environment variables',
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasOrg: !!process.env.GITHUB_ORG,
            hasRepo: !!process.env.GITHUB_REPO,
            hasSessionSecret: !!process.env.SESSION_SECRET,
        }, { status: 500 })
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        })

        const tokenData = await tokenRes.json()

        if (!tokenData.access_token) {
            return NextResponse.json({
                error: 'Token exchange failed',
                details: tokenData,
            }, { status: 500 })
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
    } catch (err) {
        return NextResponse.json({
            error: 'Callback failed',
            message: String(err),
        }, { status: 500 })
    }
}

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const errorMessages: Record<string, string> = {
        not_member: 'You must be a member of the TechSynergy organization to access this tool.',
        token_failed: 'GitHub authentication failed. Please try again.',
        no_code: 'No authorization code received. Please try again.',
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E9EAEB] p-8 text-center">
                    <h1 className="text-2xl font-bold text-[#181d27] mb-2">Help Center Admin</h1>
                    <p className="text-[#717680] text-sm mb-8">
                        Sign in with your GitHub account to manage TechSynergy help articles.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                            <p className="text-red-700 text-sm">{errorMessages[error] || 'An error occurred.'}</p>
                        </div>
                    )}

                    <a
                        href="/api/auth/github"
                        className="inline-flex items-center gap-3 bg-[#181d27] text-white px-6 py-3 rounded-xl hover:bg-[#2d3440] transition-colors text-sm font-medium"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Sign in with GitHub
                    </a>

                    <p className="text-[#A4A7AE] text-xs mt-6">
                        Only TechSynergy organization members can access this admin.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}

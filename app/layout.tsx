import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Help Center Admin | TechSynergy',
    description: 'Manage TechSynergy help center articles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

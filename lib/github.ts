const GITHUB_API = 'https://api.github.com'

interface GitHubFile {
    name: string
    path: string
    sha: string
    size: number
    type: 'file' | 'dir'
    download_url: string | null
}

interface GitHubContentResponse {
    name: string
    path: string
    sha: string
    content: string
    encoding: string
}

export class GitHubClient {
    private token: string
    private repo: string

    constructor(token: string, repo: string = process.env.GITHUB_REPO || 'techsynergy-io/techsynergy-help-center') {
        this.token = token
        this.repo = repo
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const res = await fetch(`${GITHUB_API}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`GitHub API error (${res.status}): ${error}`)
        }

        return res.json()
    }

    // List categories (top-level directories)
    async listCategories(): Promise<{ name: string; path: string }[]> {
        const contents: GitHubFile[] = await this.request(`/repos/${this.repo}/contents`)
        return contents
            .filter(f => f.type === 'dir' && !f.name.startsWith('.'))
            .map(f => ({ name: f.name, path: f.path }))
    }

    // List articles in a category
    async listArticles(category: string): Promise<{ name: string; slug: string; path: string; sha: string }[]> {
        const contents: GitHubFile[] = await this.request(`/repos/${this.repo}/contents/${category}`)
        return contents
            .filter(f => f.type === 'file' && f.name.endsWith('.md') && f.name !== 'README.md')
            .map(f => ({
                name: f.name.replace('.md', '').replace(/-/g, ' '),
                slug: f.name.replace('.md', ''),
                path: f.path,
                sha: f.sha,
            }))
    }

    // Get article content
    async getArticle(category: string, slug: string, branch: string = 'main'): Promise<{ content: string; sha: string }> {
        const data: GitHubContentResponse = await this.request(
            `/repos/${this.repo}/contents/${category}/${slug}.md?ref=${branch}`
        )
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        return { content, sha: data.sha }
    }

    // Create or update article
    async saveArticle(
        category: string,
        slug: string,
        content: string,
        message: string,
        sha?: string,
        branch: string = 'main'
    ): Promise<{ sha: string }> {
        const path = `${category}/${slug}.md`
        const body: Record<string, string> = {
            message,
            content: Buffer.from(content).toString('base64'),
            branch,
        }
        if (sha) body.sha = sha

        const data = await this.request(`/repos/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        })

        return { sha: data.content.sha }
    }

    // Delete an article
    async deleteArticle(category: string, slug: string, sha: string, branch: string = 'main'): Promise<void> {
        const path = `${category}/${slug}.md`
        await this.request(`/repos/${this.repo}/contents/${path}`, {
            method: 'DELETE',
            body: JSON.stringify({
                message: `Delete article: ${slug}`,
                sha,
                branch,
            }),
        })
    }

    // Get or create drafts branch
    async ensureDraftsBranch(): Promise<void> {
        try {
            await this.request(`/repos/${this.repo}/git/ref/heads/drafts`)
        } catch {
            // Branch doesn't exist — create from main
            const mainRef = await this.request(`/repos/${this.repo}/git/ref/heads/main`)
            await this.request(`/repos/${this.repo}/git/refs`, {
                method: 'POST',
                body: JSON.stringify({
                    ref: 'refs/heads/drafts',
                    sha: mainRef.object.sha,
                }),
            })
        }
    }

    // Create PR from drafts to main
    async createPublishPR(title: string, body: string): Promise<{ html_url: string; number: number }> {
        const data = await this.request(`/repos/${this.repo}/pulls`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                body,
                head: 'drafts',
                base: 'main',
            }),
        })
        return { html_url: data.html_url, number: data.number }
    }

    // Check if authenticated user is a member of the org
    async checkOrgMembership(username: string): Promise<boolean> {
        const org = process.env.GITHUB_ORG || 'techsynergy-io'
        try {
            // Use the membership endpoint which works for private memberships too
            const res = await fetch(`${GITHUB_API}/orgs/${org}/members/${username}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            })
            // 204 = is a member, 302 = requester is not org member, 404 = not a member
            if (res.status === 204 || res.status === 200) return true

            // Fallback: check if user can list the org's repos (proves membership)
            const orgsRes = await fetch(`${GITHUB_API}/user/orgs`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            })
            if (orgsRes.ok) {
                const orgs = await orgsRes.json()
                return orgs.some((o: { login: string }) => o.login.toLowerCase() === org.toLowerCase())
            }

            return false
        } catch {
            return false
        }
    }

    // Get current user
    async getUser(): Promise<{ login: string; avatar_url: string; name: string }> {
        return this.request('/user')
    }

    // Get SUMMARY.md content
    async getSummary(branch: string = 'main'): Promise<{ content: string; sha: string }> {
        return this.getArticle('.', 'SUMMARY', branch)
    }

    // Update SUMMARY.md
    async updateSummary(content: string, sha: string, message: string, branch: string = 'main'): Promise<void> {
        await this.saveArticle('.', 'SUMMARY', content, message, sha, branch)
    }
}

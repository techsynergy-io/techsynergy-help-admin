export interface Frontmatter {
    audience: 'freelancer' | 'business' | 'both'
    [key: string]: string
}

export function parseFrontmatter(markdown: string): { frontmatter: Frontmatter; content: string } {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/)
    if (!match) {
        // No frontmatter — try to guess audience from "Who this is for:" line
        const audienceMatch = markdown.match(/\*\*Who this is for:\*\*\s*(.*)/i)
        let audience: Frontmatter['audience'] = 'both'
        if (audienceMatch) {
            const text = audienceMatch[1].toLowerCase()
            if (text.includes('freelancer') && !text.includes('client') && !text.includes('business')) {
                audience = 'freelancer'
            } else if ((text.includes('client') || text.includes('business')) && !text.includes('freelancer')) {
                audience = 'business'
            }
        }
        return { frontmatter: { audience }, content: markdown }
    }

    const yamlBlock = match[1]
    const content = match[2]
    const frontmatter: Frontmatter = { audience: 'both' }

    for (const line of yamlBlock.split('\n')) {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length) {
            const value = valueParts.join(':').trim()
            frontmatter[key.trim()] = value
        }
    }

    return { frontmatter: frontmatter as Frontmatter, content }
}

export function serializeFrontmatter(frontmatter: Frontmatter, content: string): string {
    const yaml = Object.entries(frontmatter)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    return `---\n${yaml}\n---\n${content}`
}

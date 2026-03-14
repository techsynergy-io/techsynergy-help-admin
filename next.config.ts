import type { NextConfig } from 'next'
import { initOpenNextCloudflare } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {}

initOpenNextCloudflare(nextConfig)

export default nextConfig

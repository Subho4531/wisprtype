import { NextResponse } from 'next/server'
import { getLatestRelease } from '@/lib/githubRelease'

export const revalidate = 300

export async function GET() {
  const release = await getLatestRelease()

  if (!release) {
    return NextResponse.json(
      {
        error: 'No Windows release is available yet.',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  }

  const response = NextResponse.redirect(release.downloadUrl, {
    status: 302,
  })
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  return response
}

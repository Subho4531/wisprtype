export type LatestRelease = {
  version: string
  publishedAt: string
  downloadUrl: string
  assetName: string
  assetSize: string
  releaseUrl: string
}

type GitHubReleaseAsset = {
  name: string
  size: number
  browser_download_url: string
}

type GitHubReleaseResponse = {
  tag_name: string
  published_at: string | null
  html_url: string
  assets: GitHubReleaseAsset[]
}

const REPOSITORY = 'Subho4531/wisprtype'
const LATEST_RELEASE_URL = `https://api.github.com/repos/${REPOSITORY}/releases/latest`
const WINDOWS_INSTALLER_NAME = 'Wisprtype-Windows-x64-setup.exe'

export const RELEASES_PAGE_URL = `https://github.com/${REPOSITORY}/releases`
export const WINDOWS_DOWNLOAD_PATH = '/download/windows'

function formatAssetSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'Unknown size'
  }

  const megabytes = bytes / 1024 / 1024
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`
}

export async function getLatestRelease(): Promise<LatestRelease | null> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers,
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const release = (await response.json()) as GitHubReleaseResponse
    const installer =
      release.assets.find((asset) => asset.name === WINDOWS_INSTALLER_NAME) ??
      release.assets.find((asset) => asset.name.toLowerCase().endsWith('.exe'))

    if (!release.tag_name || !installer) {
      return null
    }

    return {
      version: release.tag_name,
      publishedAt: release.published_at ?? '',
      downloadUrl: installer.browser_download_url,
      assetName: installer.name,
      assetSize: formatAssetSize(installer.size),
      releaseUrl: release.html_url,
    }
  } catch {
    return null
  }
}

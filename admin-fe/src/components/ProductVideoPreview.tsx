const extractYouTubeVideoId = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const hostname = parsed.hostname.replace(/^www\./, '')
    if (hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0]
      return id || null
    }
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('/')[0] ?? null
      }
      const watchId = parsed.searchParams.get('v')
      if (watchId) return watchId
    }
  } catch {
    return null
  }

  return null
}

type ProductVideoPreviewProps = {
  url: string
  title?: string
}

export function ProductVideoPreview({ url, title }: ProductVideoPreviewProps) {
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null

  const youTubeId = extractYouTubeVideoId(trimmedUrl)
  if (youTubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youTubeId}`}
        title={title?.trim() || 'Video preview'}
        className="h-44 w-full rounded-lg bg-slate-950"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  return (
    <video
      src={trimmedUrl}
      controls
      preload="metadata"
      className="h-44 w-full rounded-lg bg-slate-950 object-cover"
    />
  )
}

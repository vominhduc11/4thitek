'use client';

import LazyIframe from './LazyIframe';

const getYouTubeVideoId = (url: string): string | null => {
    try {
        const parsed = new URL(url.trim());
        const hostname = parsed.hostname.replace(/^www\./, '');
        if (hostname === 'youtu.be') {
            return parsed.pathname.replace(/^\/+/, '').split('/')[0] || null;
        }
        if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
            if (parsed.pathname.startsWith('/embed/')) {
                return parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
            }
            return parsed.searchParams.get('v');
        }
    } catch {
        return null;
    }

    return null;
};

type ResponsiveVideoProps = {
    url: string;
    title: string;
    className: string;
    videoClassName?: string;
};

export default function ResponsiveVideo({
    url,
    title,
    className,
    videoClassName
}: ResponsiveVideoProps) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    const youTubeId = getYouTubeVideoId(trimmedUrl);
    if (youTubeId) {
        return (
            <LazyIframe
                src={`https://www.youtube.com/embed/${youTubeId}`}
                title={title}
                className={className}
            />
        );
    }

    return (
        <video
            src={trimmedUrl}
            controls
            preload="metadata"
            playsInline
            className={videoClassName ?? className}
        />
    );
}

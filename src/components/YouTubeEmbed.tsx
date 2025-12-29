'use client';

interface YouTubeEmbedProps {
    url: string;
    title?: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/i,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export default function YouTubeEmbed({ url, title = 'Workout Demonstration' }: YouTubeEmbedProps) {
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        return null; // Invalid URL, don't render anything
    }

    return (
        <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-xl border border-zinc-200">
            {/* 16:9 Aspect Ratio Container */}
            <div className="relative pb-[56.25%] h-0">
                <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
        </div>
    );
}

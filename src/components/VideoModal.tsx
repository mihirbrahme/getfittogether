'use client';

import { useState } from 'react';
import { X, Play } from 'lucide-react';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface VideoModalProps {
    url: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function VideoModal({ url, title, isOpen, onClose }: VideoModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Title */}
                <h3 className="text-white text-center font-black uppercase mb-4 text-lg">
                    {title}
                </h3>

                {/* Video container */}
                <div className="rounded-2xl overflow-hidden bg-black">
                    <YouTubeEmbed url={url} />
                </div>

                {/* Tap to close hint */}
                <p className="text-white/50 text-center text-xs mt-4 font-semibold">
                    Tap outside to close
                </p>
            </div>
        </div>
    );
}

interface VideoThumbnailButtonProps {
    url: string;
    title: string;
}

export function VideoThumbnailButton({ url, title }: VideoThumbnailButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Extract YouTube video ID for thumbnail - handles multiple URL formats
    const getVideoId = (url: string) => {
        if (!url) return null;
        const trimmedUrl = url.trim();

        const patterns = [
            // Standard watch URL
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
            // Short URL
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
            // Embed URL
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
            // Shorts URL
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
            // Old style /v/ URL
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
            // Direct video ID
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = trimmedUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    };

    const videoId = getVideoId(url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="relative w-full aspect-video rounded-xl overflow-hidden group bg-zinc-100"
            >
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-200">
                        <Play className="h-12 w-12 text-zinc-400" />
                    </div>
                )}

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-all">
                    <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white ml-1" fill="white" />
                    </div>
                </div>

                {/* Fullscreen hint */}
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs font-bold">
                    Tap to play fullscreen
                </div>
            </button>

            <VideoModal
                url={url}
                title={title}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

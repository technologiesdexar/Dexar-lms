'use client';

import React, { useEffect } from 'react';
import { resolveVideoEmbed } from '@/lib/videoEmbed';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoUrl: string | null;
  title?: string;
  notesUrl?: string;
  onClose: () => void;
}

export function VideoPlayerModal({
  isOpen,
  videoUrl,
  onClose,
}: VideoPlayerModalProps) {
  const embedInfo = resolveVideoEmbed(videoUrl);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer shadow-lg"
          aria-label="Close video"
        >
          <X className="w-5 h-5 text-black stroke-[2.5]" />
        </button>

        <div className="aspect-video w-full bg-black flex items-center justify-center">
          {embedInfo.type === 'video' ? (
            <video
              src={embedInfo.embedUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            >
              Your browser does not support HTML5 video streaming.
            </video>
          ) : (
            <iframe
              src={embedInfo.embedUrl}
              title="Lecture Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}

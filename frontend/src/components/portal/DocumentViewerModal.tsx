'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { getDrivePreviewUrl, getDriveDownloadUrl, getFormatBadge } from '@/utils/googleDrive';

interface DocumentViewerModalProps {
  isOpen: boolean;
  title: string;
  driveUrl: string;
  fileFormat?: string;
  subjectName?: string;
  onClose: () => void;
}

export function DocumentViewerModal({
  isOpen,
  title,
  driveUrl,
  fileFormat = 'pdf',
  subjectName,
  onClose,
}: DocumentViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const previewUrl = getDrivePreviewUrl(driveUrl);
  const downloadUrl = getDriveDownloadUrl(driveUrl, fileFormat);
  const badge = getFormatBadge(fileFormat);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLoading(true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, driveUrl, onClose]);

  if (!isOpen || !driveUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container: Clean White Card */}
      <div className="w-full max-w-5xl h-[92vh] bg-white text-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-slate-200/90 flex flex-col">
        {/* Top Navigation Bar (White Theme) */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-[#0a2540] truncate max-w-xs sm:max-w-md md:max-w-xl">
                  {title || 'Course Document'}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.colorClass} ${badge.bgClass}`}>
                  {badge.label}
                </span>
                {subjectName && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 hidden sm:inline-block border border-slate-200">
                    {subjectName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block mt-0.5">
                Interactive Document Reader • Powered by Google Drive
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Download Button */}
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
              title="Download file directly"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Open in Google Drive */}
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
              title="Open full file in Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open Drive</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-1"
              aria-label="Close document viewer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Embedded Document Viewer Body */}
        <div className="relative flex-1 w-full bg-slate-50 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs text-slate-500 gap-3 z-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
              <p className="text-xs font-semibold text-slate-700">Loading document preview...</p>
              <p className="text-[11px] text-slate-400 max-w-xs text-center">
                Fetching document from Google Drive. Please ensure the file share permission is set to Anyone with the link.
              </p>
            </div>
          )}

          <iframe
            src={previewUrl}
            title={title}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setLoading(false)}
            allow="autoplay"
          />
        </div>

        {/* Bottom Helper Bar (White Theme) */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span className="font-medium">Ready for student viewing & offline download</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563eb] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Having trouble reading? Open in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

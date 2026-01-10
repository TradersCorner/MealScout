import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

interface VideoTranscriptProps {
  transcript: string;
  language?: string;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * SEO-optimized video transcript component
 * 
 * Renders transcript in crawlable HTML with collapsed UI by default
 * Satisfies SEO + LLMO requirements with minimal UX clutter
 * 
 * Always present in DOM for search engines and LLMs
 * User can expand to read if desired
 */
export function VideoTranscript({ 
  transcript, 
  language = "en", 
  className = "", 
  defaultExpanded = false 
}: VideoTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!transcript || transcript.trim().length === 0) {
    return null;
  }

  return (
    <section className={`video-transcript ${className}`} lang={language}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg border border-gray-200"
        aria-expanded={isExpanded}
        aria-controls="transcript-content"
      >
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <FileText className="w-4 h-4" />
          <span>Video Transcript</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      <div
        id="transcript-content"
        className={`transcript-text mt-2 px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden ${
          isExpanded ? "max-h-[600px] overflow-y-auto" : "max-h-0 border-0 py-0"
        }`}
      >
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {transcript}
        </div>
      </div>
    </section>
  );
}

/**
 * Always-visible minimal transcript (for maximum SEO)
 * Text is visible but styled to be secondary
 */
export function MinimalTranscript({ 
  transcript, 
  language = "en", 
  className = "" 
}: Omit<VideoTranscriptProps, 'defaultExpanded'>) {
  if (!transcript || transcript.trim().length === 0) {
    return null;
  }

  return (
    <section className={`minimal-transcript text-xs text-gray-600 ${className}`} lang={language}>
      <h4 className="font-medium text-gray-700 mb-2 text-sm">Transcript</h4>
      <div className="leading-relaxed whitespace-pre-wrap">
        {transcript}
      </div>
    </section>
  );
}

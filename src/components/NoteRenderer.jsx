import React from 'react';

export default function NoteRenderer({ text, className = "", textSize = "text-[11px]" }) {
  if (!text) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Bullet detection
        const bulletMatch = trimmed.match(/^(\d+\.|[\-*•])\s+(.*)/);
        const isNumbered = bulletMatch && /^\d/.test(bulletMatch[1]);
        const bullet = bulletMatch ? (isNumbered ? bulletMatch[1] : '•') : null;
        const content = bulletMatch ? bulletMatch[2] : trimmed;

        // Bold detection and linkification
        const parts = content.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+|www\.[^\s]+)/g);
        const renderedLine = parts.map((part, pi) => {
          if (!part) return null;
          
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pi} className="text-app-heading font-black">{part.slice(2, -2)}</strong>;
          }
          
          if (part.match(/^(https?:\/\/|www\.)/)) {
            return (
              <a 
                key={pi}
                href={part.startsWith('www.') ? `https://${part}` : part}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-accent hover:underline font-bold break-all"
              >
                {part}
              </a>
            );
          }
          return part;
        });

        return (
          <div key={i} className={`flex gap-3 ${textSize} leading-relaxed group/line`}>
            {bullet ? (
              <span className={`shrink-0 font-black w-4 text-right ${isNumbered ? 'text-accent/50' : 'text-accent text-sm'}`}>
                {bullet}
              </span>
            ) : (
              <div className="w-4 shrink-0" />
            )}
            <p className="font-medium text-app-muted break-words flex-1">
              {renderedLine}
            </p>
          </div>
        );
      })}
    </div>
  );
}

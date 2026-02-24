import React, { useEffect, useRef, useState } from 'react';

type WatermarkTone = 'default' | 'admin';

export default function Watermark({
  className = '',
  tone = 'default',
}: {
  className?: string;
  tone?: WatermarkTone;
}) {
  const [expanded, setExpanded] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const beginReveal = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      setExpanded(true);
    }, 3000);
  };

  const endReveal = () => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    if (!expanded) return;
    hideTimer.current = window.setTimeout(() => {
      setExpanded(false);
    }, 1200);
  };

  const beginLongPress = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'touch') return;
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    revealTimer.current = window.setTimeout(() => {
      setExpanded(true);
    }, 650);
  };

  const endLongPress = () => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
  };

  const toneClass =
    tone === 'admin'
      ? 'text-slate-400/65 hover:text-slate-200/80'
      : 'text-text-muted/70 hover:text-text-muted/90';
  const detailTone = tone === 'admin' ? 'text-slate-400/55' : 'text-text-muted/60';

  return (
    <div className={`select-none ${className}`}>
      <a
        href="https://byteandberry.com/"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={beginReveal}
        onMouseLeave={endReveal}
        onPointerDown={beginLongPress}
        onPointerUp={endLongPress}
        onPointerCancel={endLongPress}
        onPointerLeave={endLongPress}
        className={`inline-flex text-[11px] font-medium no-underline transition-[var(--transition-fast)] hover:underline active:opacity-55 ${toneClass}`}
        aria-label="Made by Byte&Berry - opens byteandberry.com"
      >
        Made by Byte&amp;Berry
      </a>
      {expanded ? (
        <p className={`mt-1 text-[11px] leading-[1.35] ${detailTone}`}>
          Product design &amp; engineering by Byte&amp;Berry
        </p>
      ) : null}
    </div>
  );
}

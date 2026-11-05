import {ReactElement, useEffect, useRef, useState} from 'react';

export interface StickToBottomLogProps {
  /** Transcript lines, append-only while a run streams. */
  lines: string[];
  /** True while the producer is still emitting; reflected as `aria-busy` on the log. */
  streaming: boolean;
  /** Distance (px) from the bottom that still counts as "at the bottom". Default 16. */
  threshold?: number;
  /** Fires only when following flips (never on mount). */
  onFollowChange?: (following: boolean) => void;
}

export function StickToBottomLog({
  lines,
  streaming,
  threshold = 16,
  onFollowChange,
                                 }: StickToBottomLogProps): ReactElement {
  const [following, setFollowing] = useState(true);
  const [unread, setUnread] = useState(0);

  const followingRef = useRef(true);
  const onFollowChangeRef = useRef(onFollowChange);
  onFollowChangeRef.current = onFollowChange;

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(lines.length);

  const pinToBottom = () => {
    const el = containerRef.current;
    if(el) el.scrollTop = el.scrollHeight - el.clientHeight;
  }

  const setMode = (next: boolean) => {
    if(followingRef.current === next) return;
    followingRef.current = next;
    setFollowing(next);
    if(next) setUnread(0);
    onFollowChangeRef.current?.(next);
  }

  useEffect(() => {
    const target = contentRef.current;
    if(!target) return;
    const observer = new ResizeObserver(() => {
      if(followingRef.current) pinToBottom();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const added = lines.length - prevCountRef.current;
    prevCountRef.current = lines.length;
    if(added > 0 && !followingRef.current) setUnread((n) => n + added);
  }, [lines.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if(!el) return;
    const distance = el.scrollHeight - el.clientHeight - el.scrollTop;
    setMode(distance <= threshold);
  };

  const jumpToLatest = () => {
    pinToBottom();
    setMode(true);
  }

  return (
    <div style={{position: 'relative', height: '100%', minHeight: 0}}>
      <div
        ref={containerRef}
        role="log"
        aria-live="polite"
        aria-busy={streaming || undefined}
        onScroll={handleScroll}
        style={{overflowY: 'auto', height: '100%', minHeight: 0}}
      >
        <div ref={contentRef}>
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
      {!following && (
        <button type="button" onClick={jumpToLatest} style={{position: 'absolute', right: 12, bottom: 12}}>
          Jump to latest ({unread} new)
        </button>
      )}
    </div>
  )
}

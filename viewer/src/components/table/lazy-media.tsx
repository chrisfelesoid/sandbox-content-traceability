import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export type MediaKind = 'audio' | 'video' | 'image';

export function mediaKindFromModality(modality: string): MediaKind {
  if (modality === 'video') return 'video';
  if (modality === 'image') return 'image';
  return 'audio';
}

export function LazyMedia({
  src,
  kind,
  className,
}: {
  src: string;
  kind: MediaKind;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: '200px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {!visible && <Skeleton className="h-12 w-full" />}
      {visible && errored && <div className="text-xs text-destructive">media failed</div>}
      {visible && !errored && kind === 'audio' && (
        <audio
          controls
          preload="none"
          src={src}
          className="w-full"
          onError={() => setErrored(true)}
        >
          <track kind="captions" />
        </audio>
      )}
      {visible && !errored && kind === 'video' && (
        <video
          controls
          preload="none"
          src={src}
          className="w-full"
          onError={() => setErrored(true)}
        >
          <track kind="captions" />
        </video>
      )}
      {visible && !errored && kind === 'image' && (
        <img src={src} alt="" className="w-full" onError={() => setErrored(true)} />
      )}
    </div>
  );
}

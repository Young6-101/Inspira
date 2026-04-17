import { useEffect, useRef, useState } from 'react';
import { BackdropCard } from './BackdropDecor.tsx';

type LineSegment = {
  from: string;
  to: string;
  tone?: 'main' | 'faint';
};

type RenderSegment = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone: 'main' | 'faint';
};

const CARD_CONNECTIONS: LineSegment[] = [
  { from: 'snapshot', to: 'ship', tone: 'main' },
  { from: 'snapshot', to: 'question', tone: 'main' },
  { from: 'snapshot', to: 'link', tone: 'main' },
  { from: 'snapshot', to: 'draft', tone: 'faint' },
  { from: 'snapshot', to: 'trace', tone: 'faint' },
  { from: 'link', to: 'layer', tone: 'faint' },
  { from: 'ship', to: 'echo', tone: 'faint' }
];

export default function HomeHeroBackdrop() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [segments, setSegments] = useState<RenderSegment[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateLines = () => {
      const containerRect = container.getBoundingClientRect();
      const points = new Map<string, { x: number; y: number }>();

      container.querySelectorAll<HTMLElement>('[data-backdrop-card-id]').forEach((el) => {
        const id = el.dataset.backdropCardId;
        if (!id) {
          return;
        }

        const rect = el.getBoundingClientRect();
        points.set(id, {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top
        });
      });

      const nextSegments: RenderSegment[] = CARD_CONNECTIONS.flatMap(({ from, to, tone = 'main' }) => {
        const a = points.get(from);
        const b = points.get(to);
        if (!a || !b) {
          return [];
        }

        return [
          {
            key: `${from}-${to}`,
            x1: a.x,
            y1: a.y,
            x2: b.x,
            y2: b.y,
            tone
          }
        ];
      });

      setSegments(nextSegments);
    };

    const observer = new ResizeObserver(() => {
      updateLines();
    });

    observer.observe(container);
    container.querySelectorAll<HTMLElement>('[data-backdrop-card-id]').forEach((el) => observer.observe(el));

    const rafId = requestAnimationFrame(() => updateLines());
    window.addEventListener('resize', updateLines);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', updateLines);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="hero-backdrop-wash hero-backdrop-wash--coral" />
      <div className="hero-backdrop-wash hero-backdrop-wash--electric" />
      <div className="hero-backdrop-wash hero-backdrop-wash--violet" />

      <svg className="hero-backdrop-connectors" width="100%" height="100%">
        {segments.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className={`hero-backdrop-connector-line hero-backdrop-connector-line--${line.tone}`}
          />
        ))}
      </svg>

      <BackdropCard
        cardId="snapshot"
        variant="polaroid"
        className="hero-backdrop-card--lg left-[2%] top-[8%] hidden md:block"
        rotation={-8}
        scale={1.1}
        opacity={0.95}
        zIndex={2}
        title="Snapshot"
        subtitle="Messy thought"
        imageToneClassName="from-accentCoral/75 via-accentGold/70 to-accentViolet/70"
      />

      <BackdropCard
        cardId="ship"
        variant="note"
        className="hero-backdrop-card--md left-[75%] top-[7%] hidden lg:block"
        rotation={7}
        scale={1}
        opacity={0.9}
        zIndex={2}
        title="Ship ideas first"
        subtitle="Refine after pattern appears"
        tapeColorClassName="bg-accentElectric"
      />

      <BackdropCard
        cardId="question"
        variant="note"
        className="hero-backdrop-card--sm left-[5%] top-[58%] hidden md:block"
        rotation={-4}
        scale={0.92}
        opacity={0.82}
        zIndex={1}
        title="Question stack"
        subtitle="Why now? Why this?"
        tapeColorClassName="bg-accentCoral"
      />

      <BackdropCard
        cardId="link"
        variant="polaroid"
        className="hero-backdrop-card--xl left-[72%] top-[52%] hidden md:block"
        rotation={6}
        scale={1.2}
        opacity={0.88}
        zIndex={1}
        title="Link"
        subtitle="Signal found"
        imageToneClassName="from-accentElectric/70 via-accentViolet/70 to-accentCoral/75"
      />

      <BackdropCard
        cardId="draft"
        variant="polaroid"
        className="hero-backdrop-card--ghost hero-backdrop-card--sm left-[24%] top-[2%] hidden lg:block"
        rotation={-12}
        scale={0.84}
        opacity={0.44}
        zIndex={0}
        title="Draft"
        subtitle="Loose connection"
        imageToneClassName="from-accentViolet/55 via-accentElectric/45 to-accentGold/45"
      />

      <BackdropCard
        cardId="layer"
        variant="note"
        className="hero-backdrop-card--ghost hero-backdrop-card--xs left-[60%] top-[76%] hidden lg:block"
        rotation={9}
        scale={0.76}
        opacity={0.34}
        zIndex={0}
        title="Layer"
        subtitle="Keep signals visible"
        tapeColorClassName="bg-accentViolet"
      />

      <BackdropCard
        cardId="trace"
        variant="polaroid"
        className="hero-backdrop-card--ghost hero-backdrop-card--md left-[14%] top-[74%] hidden xl:block"
        rotation={4}
        scale={0.9}
        opacity={0.4}
        zIndex={0}
        title="Trace"
        subtitle="Follow the thread"
        imageToneClassName="from-accentGold/50 via-accentCoral/45 to-accentElectric/45"
      />

      <BackdropCard
        cardId="echo"
        variant="note"
        className="hero-backdrop-card--ghost hero-backdrop-card--sm left-[84%] top-[36%] hidden xl:block"
        rotation={14}
        scale={0.78}
        opacity={0.3}
        zIndex={0}
        title="Echo"
        subtitle="Side branch"
        tapeColorClassName="bg-accentGold"
      />

      <BackdropCard
        variant="polaroid"
        className="hero-backdrop-card--sm left-[34%] top-[70%] md:hidden"
        rotation={-5}
        scale={0.9}
        opacity={0.86}
        title="Spark"
        subtitle="Start anywhere"
        imageToneClassName="from-accentGold/70 via-accentCoral/70 to-accentViolet/70"
      />
    </div>
  );
}

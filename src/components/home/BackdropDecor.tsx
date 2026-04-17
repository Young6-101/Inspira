import type { CSSProperties } from 'react';

type BackdropCardVariant = 'polaroid' | 'note';

type BackdropCardProps = {
  cardId?: string;
  variant: BackdropCardVariant;
  title: string;
  subtitle?: string;
  className?: string;
  rotation?: number;
  scale?: number;
  opacity?: number;
  zIndex?: number;
  tapeColorClassName?: string;
  imageToneClassName?: string;
};


export function BackdropCard({
  cardId,
  variant,
  title,
  subtitle,
  className = '',
  rotation = 0,
  scale = 1,
  opacity = 1,
  zIndex,
  tapeColorClassName = 'bg-accentGold',
  imageToneClassName = 'from-accentCoral/70 to-accentElectric/70'
}: BackdropCardProps) {
  const cardStyle: CSSProperties = {
    transform: `rotate(${rotation}deg) scale(${scale})`,
    opacity,
    zIndex
  };

  return (
    <div
      data-backdrop-card-id={cardId}
      className={`hero-backdrop-card hero-backdrop-card--${variant} ${className}`}
      style={cardStyle}
    >
      <span className={`hero-backdrop-tape ${tapeColorClassName}`} />
      {variant === 'polaroid' ? (
        <>
          <div className={`hero-backdrop-photo bg-gradient-to-br ${imageToneClassName}`} />
          <p className="hero-backdrop-title">{title}</p>
          {subtitle ? <p className="hero-backdrop-subtitle">{subtitle}</p> : null}
        </>
      ) : (
        <>
          <p className="hero-backdrop-note-title">{title}</p>
          {subtitle ? <p className="hero-backdrop-note-subtitle">{subtitle}</p> : null}
        </>
      )}
    </div>
  );
}

type BackdropThreadProps = {
  className?: string;
  left: string;
  top: string;
  width: string;
  angle: number;
};

export function BackdropThread({ className = '', left, top, width, angle }: BackdropThreadProps) {
  const style: CSSProperties = {
    left,
    top,
    width,
    transform: `rotate(${angle}deg)`
  };

  return <span className={`hero-backdrop-thread ${className}`} style={style} />;
}

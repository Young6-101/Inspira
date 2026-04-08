import { useCallback, useEffect, useRef, useState } from 'react';

type DecryptedTextProps = {
  text: string;
  className?: string;
  loopDelay?: number;
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export default function DecryptedText({ text, className = '', loopDelay = 7000 }: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const revealTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);

  const stopReveal = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const runDecryptAnimation = useCallback(() => {
    stopReveal();

    let iteration = 0;
    revealTimerRef.current = window.setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') {
              return ' ';
            }

            if (index < iteration) {
              return text[index];
            }

            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(''),
      );

      iteration += 0.45;
      if (iteration >= text.length) {
        stopReveal();
        setDisplayText(text);
      }
    }, 35);
  }, [stopReveal, text]);

  useEffect(() => {
    runDecryptAnimation();

    if (loopDelay > 0) {
      loopTimerRef.current = window.setInterval(() => {
        runDecryptAnimation();
      }, loopDelay);
    }

    return () => {
      stopReveal();
      if (loopTimerRef.current !== null) {
        window.clearInterval(loopTimerRef.current);
      }
    };
  }, [loopDelay, runDecryptAnimation, stopReveal]);

  return (
    <span className={className} onMouseEnter={runDecryptAnimation}>
      {displayText}
    </span>
  );
}

import { useState, useCallback, useRef } from 'react';

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

export function useScramble(text: string, duration = 800) {
    const [displayText, setDisplayText] = useState(text);
    const frameRef = useRef<number>();

    const trigger = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }

        const startTime = Date.now();
        const textLength = text.length;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress === 1) {
                setDisplayText(text);
                return;
            }

            const charsToReveal = Math.floor(progress * textLength);
            const scrambled = text
                .split('')
                .map((char, i) => {
                    if (i < charsToReveal) {
                        return char;
                    }
                    if (char === ' ') {
                        return ' ';
                    }
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                })
                .join('');

            setDisplayText(scrambled);
            frameRef.current = requestAnimationFrame(animate);
        };

        animate();
    }, [text, duration]);

    return { displayText, trigger };
}

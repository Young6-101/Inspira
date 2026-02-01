import { useState, useCallback } from "react";

export const useScramble = (text: string) => {
  const [displayChar, setDisplayChar] = useState("");
  const chars = "!@#$%^&*()_+{}[]|;:,.<>?";

  const trigger = useCallback(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayChar(
        text.split("").map((letter, index) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
  }, [text]);

  return { displayChar, trigger };
};
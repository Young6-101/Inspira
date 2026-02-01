import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";

// --- 简单的 SVG 图标组件 ---
const PlusIcon = () => (
  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

const ChevronDown = () => (
  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function MainView() {
  const subtitleText = "From chaos to clarity.";
  const [displaySubtitle, setDisplaySubtitle] = useState("");
  const chars = "!@#$%^&*()_+{}[]|;:,.<>?";

  const triggerScramble = useCallback(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplaySubtitle(subtitleText.split("").map((letter, index) => {
        if (index < iteration) return subtitleText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if (iteration >= subtitleText.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
  }, [subtitleText]);

  useEffect(() => { triggerScramble(); }, [triggerScramble]);

  return (
    <div className="relative h-full w-full flex flex-col justify-center items-center text-center p-8 bg-[#f9f9f9] overflow-hidden">
      
      {/* 1. 主标题区域 */}
      <div className="flex flex-col items-center">
        <motion.h1 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#000000] flex flex-wrap justify-center gap-x-4"
        >
          <span>Scatter Now.</span>
          <motion.span 
            whileHover="hover"
            className="relative inline-block cursor-default text-primary overflow-hidden px-1"
          >
            Think later.
            <motion.div 
              variants={{ hover: { x: ["-100%", "200%"] } }}
              transition={{ duration: 0.8, ease: "linear" }}
              className="absolute inset-0 w-1/2 h-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            />
          </motion.span>
        </motion.h1>

        {/* 2. 乱码副标题 */}
        <motion.div 
          onMouseEnter={triggerScramble}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-6 font-mono text-lg md:text-xl text-default-500 cursor-pointer select-none tracking-widest uppercase"
        >
          {displaySubtitle}
        </motion.div>

        {/* 3. HeroUI 圆形加号按钮 (带投影) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.8, type: "spring" }}
          className="mt-12"
        >
          <Button
            isIconOnly
            color="primary"
            radius="full"
            variant="shadow" // 这就是自带的投影效果
            size="lg"
            className="w-16 h-16 shadow-primary/40" // 稍微加深投影颜色，让它更“浮”起来
            aria-label="Add project"
          >
            <PlusIcon />
          </Button>
        </motion.div>
      </div>

      {/* 4. 底部滑动指示标识 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <p className="text-[10px] tracking-[0.3em] uppercase text-default-400 font-medium">Scroll</p>
        <motion.div
          animate={{ y: [0, 8, 0] }} // 循环上下跳动
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-default-400"
        >
          <ChevronDown />
        </motion.div>
      </motion.div>

    </div>
  );
}
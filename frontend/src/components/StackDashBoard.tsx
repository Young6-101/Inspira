import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll } from '@react-three/drei';
import { Scene } from './Scene';

const ScrollProgressCapture = ({ onProgress }: { onProgress: (progress: number) => void }) => {
  const scroll = useScroll();
  useFrame(() => {
    onProgress(scroll.offset);
  });
  return null;
};

export const StackDashboard = ({ stacks, children, onScrollProgress }: { stacks: any[]; children: React.ReactNode; onScrollProgress?: (progress: number) => void }) => {
  const hasStacks = stacks.length > 0;

  return (
    <Canvas orthographic camera={{ zoom: 80, position: [0, 0, 10] }} className="w-full h-full">
      <color attach="background" args={['#f9f9f9']} />
      <Suspense fallback={null}>
        <ScrollControls 
          damping={2} 
          pages={hasStacks ? 2 : 1} 
          enabled={hasStacks}
        >
          {onScrollProgress && <ScrollProgressCapture onProgress={onScrollProgress} />}
          <Scroll>
            <Scene stacks={stacks} />
          </Scroll>

          <Scroll html style={{ width: '100%' }}>
            {children}
          </Scroll>
        </ScrollControls>
      </Suspense>
    </Canvas>
  );
};
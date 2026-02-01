import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Scroll } from '@react-three/drei';
import { Scene } from './Scene';

export const StackDashboard = ({ stacks, children }: { stacks: any[]; children: React.ReactNode }) => {
  const hasStacks = stacks.length > 0;

  return (
    <Canvas orthographic camera={{ zoom: 80, position: [0, 0, 10] }} className="w-full h-full">
      <color attach="background" args={['#f9f9f9']} />
      <Suspense fallback={null}>
        <ScrollControls 
          damping={2} 
          // 关键：没有文件夹时只有 1 页，滑不动
          pages={hasStacks ? 2 : 1} 
          enabled={hasStacks}
        >
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
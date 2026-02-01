import * as THREE from 'three';
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useScroll, Edges } from '@react-three/drei';

function StackItem3D({ name, index, total }: { name: string, index: number, total: number }) {
  const ref = useRef<THREE.Group>(null!);
  const scroll = useScroll();
  const { height } = useThree((state) => state.viewport);

  useFrame((state, delta) => {
    // 1. Pop 缩放动效
    const rScale = scroll.range(0.4, 0.4); 
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, rScale, 4, delta));

    // 2. 提拉位移：从第一页下方升到第二页中间偏下位置
    const rY = scroll.range(0.3, 0.5);
    // 这里的 -1.5 是为了让它在 Management 标题下方显示
    const targetY = THREE.MathUtils.lerp(-height, -1.5, rY);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, targetY, 4, delta);
  });

  // 3. 横向排开
  const spacing = 4.8;
  const xOffset = (index - (total - 1) / 2) * spacing;

  return (
    <group ref={ref} position={[xOffset, -20, 0]} scale={0}>
      <mesh>
        <planeGeometry args={[4, 2.5]} />
        <meshBasicMaterial color="#0a86ce" transparent opacity={0.05} />
        <Edges color="#0a86ce" opacity={0.3} transparent />
      </mesh>
      
      {/* 文件夹图标详情 */}
      <group position={[-1.5, 0, 0.05]}>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.1, 0.8, 0.01]} /><meshBasicMaterial color="#0a86ce" /></mesh>
        <mesh position={[0.3, -0.2, 0]}><boxGeometry args={[0.1, 0.8, 0.01]} /><meshBasicMaterial color="#0a86ce" /></mesh>
      </group>

      <Text position={[0.2, 0, 0.1]} fontSize={0.3} color="#222" anchorX="left">
        {name.toUpperCase()}
      </Text>
    </group>
  );
}

export function Scene({ stacks }: { stacks: any[] }) {
  return (
    <group>
      {stacks.map((s, i) => (
        <StackItem3D key={s.id} name={s.name} index={i} total={stacks.length} />
      ))}
    </group>
  );
}
import { useState } from "react";

export interface Stack {
  id: string;
  name: string;
}

export const useStacks = () => {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const addStack = (name: string) => {
    const newStack: Stack = { id: Math.random().toString(36).substr(2, 9), name };
    setStacks((prev) => [...prev, newStack]);
  };
  return { stacks, addStack };
};
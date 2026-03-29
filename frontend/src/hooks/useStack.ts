import { useState } from "react";

export interface Stack {
  id: string;
  name: string;
  createdAt: number;
  fileCount?: number;
}

export const useStacks = () => {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const addStack = (name: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newStack: Stack = {
      id,
      name,
      createdAt: Date.now()
    };
    setStacks((prev) => [...prev, newStack]);
    return id;
  };
  const updateFileCount = (id: string, count: number) => {
    setStacks((prev) => prev.map(s => s.id === id ? { ...s, fileCount: count } : s));
  };
  return { stacks, addStack, updateFileCount };
};
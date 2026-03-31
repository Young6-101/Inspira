import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

type NodeType = 'text' | 'image' | 'audio' | 'presentation' | 'document' | 'video';

export type WorkspaceNodeData = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  textPreview?: string;
  imageSrc?: string;
};

export default function useWorkspace() {
  const [nodes, setNodes] = useState<WorkspaceNodeData[]>([]);
  const [aiVisible, setAiVisible] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageBlobUrlsRef = useRef<Set<string>>(new Set());

  const snap = (value: number): number => Math.round(value / 40) * 40;

  const limitWords = (input: string, maxWords = 100): string => {
    const words = input.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      return input.trim();
    }
    return words.slice(0, maxWords).join(' ');
  };

  const getNextPosition = (index: number) => {
    const colCount = 3;
    const baseX = 120;
    const baseY = 120;
    const spacingX = 320;
    const spacingY = 260;

    const col = index % colCount;
    const row = Math.floor(index / colCount);
    return {
      x: snap(baseX + col * spacingX),
      y: snap(baseY + row * spacingY)
    };
  };

  const removeNode = (id: string) => {
    setNodes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target?.imageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(target.imageSrc);
        imageBlobUrlsRef.current.delete(target.imageSrc);
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const renameNode = (id: string, nextLabel: string) => {
    const normalized = nextLabel.trim();
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, label: normalized } : node)));
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const source = Array.from(files);
    if (source.length === 0) return;

    const accepted = source.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        name.endsWith('.txt') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.ppt') ||
        name.endsWith('.pptx') ||
        name.endsWith('.doc') ||
        name.endsWith('.docx') ||
        name.endsWith('.pdf') ||
        name.endsWith('.mp4') ||
        name.endsWith('.mov') ||
        name.endsWith('.webm')
      );
    });

    if (accepted.length === 0) return;

    const startIndex = nodes.length;
    const nextNodes: WorkspaceNodeData[] = [];

    for (let i = 0; i < accepted.length; i += 1) {
      const file = accepted[i];
      const lower = file.name.toLowerCase();
      const pos = getNextPosition(startIndex + i);

      if (lower.endsWith('.txt')) {
        const rawText = await file.text();
        const textPreview = limitWords(rawText) || 'Empty text file';
        nextNodes.push({
          id: crypto.randomUUID(),
          type: 'text',
          x: pos.x,
          y: pos.y,
          label: file.name,
          textPreview
        });
        continue;
      }

      if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
        nextNodes.push({
          id: crypto.randomUUID(),
          type: 'presentation',
          x: pos.x,
          y: pos.y,
          label: file.name
        });
        continue;
      }

      if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.pdf')) {
        nextNodes.push({
          id: crypto.randomUUID(),
          type: 'document',
          x: pos.x,
          y: pos.y,
          label: file.name
        });
        continue;
      }

      if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
        nextNodes.push({
          id: crypto.randomUUID(),
          type: 'video',
          x: pos.x,
          y: pos.y,
          label: file.name
        });
        continue;
      }

      const imageSrc = URL.createObjectURL(file);
      imageBlobUrlsRef.current.add(imageSrc);
      nextNodes.push({
        id: crypto.randomUUID(),
        type: 'image',
        x: pos.x,
        y: pos.y,
        label: file.name,
        imageSrc
      });
    }

    setNodes((prev) => [...prev, ...nextNodes]);
  };

  const addThoughtNode = (text: string) => {
    const normalized = limitWords(text);
    if (!normalized) return;

    const pos = getNextPosition(nodes.length);
    const nextNode: WorkspaceNodeData = {
      id: crypto.randomUUID(),
      type: 'text',
      x: pos.x,
      y: pos.y,
      label: 'TXT_NODE',
      textPreview: normalized
    };

    setNodes((prev) => [...prev, nextNode]);
  };

  const onMouseDownNode = (id: string, e: ReactMouseEvent, node: WorkspaceNodeData) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDraggingId(id);
    dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
  };

  const onMouseMoveCanvas = (e: ReactMouseEvent, canvasRect: DOMRect) => {
    const relX = Math.round(e.clientX - canvasRect.left);
    const relY = Math.round(e.clientY - canvasRect.top);
    setCoords({ x: relX, y: relY });

    if (!draggingId || e.buttons !== 1) return;

    const nx = e.clientX - canvasRect.left - dragOffset.current.x;
    const ny = e.clientY - canvasRect.top - dragOffset.current.y;
    setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x: nx, y: ny } : n)));
  };

  useEffect(() => {
    if (!draggingId) return;
    const finish = () => {
      setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x: snap(n.x), y: snap(n.y) } : n)));
      setDraggingId(null);
    };
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
  }, [draggingId]);

  const organizeFiles = () => {
    setDraggingId(null);

    const startX = 80;
    const startY = 80;
    const gap = 40;
    const rightGutter = aiVisible ? 440 : 80;
    const viewportUsableWidth = Math.max(360, window.innerWidth - rightGutter);
    const maxX = Math.max(520, viewportUsableWidth);

    const sizeByType: Record<NodeType, { width: number; height: number }> = {
      text: { width: 256, height: 170 },
      image: { width: 256, height: 255 },
      audio: { width: 288, height: 96 },
      presentation: { width: 360, height: 230 },
      document: { width: 280, height: 430 },
      video: { width: 420, height: 280 }
    };

    setNodes((prev) => {
      const sorted = [...prev].sort((a, b) => (a.y - b.y) || (a.x - b.x));

      let currentX = startX;
      let currentY = startY;
      let rowHeight = 0;

      return sorted.map((node) => {
        let size = sizeByType[node.type] ?? { width: 280, height: 180 };

        if (node.type === 'text') {
          const wordCount = (node.textPreview || '').trim().split(/\s+/).filter(Boolean).length;
          const estimatedHeight = Math.min(420, 170 + Math.ceil(Math.max(wordCount - 24, 0) / 12) * 24);
          size = { width: 256, height: estimatedHeight };
        }

        if (currentX + size.width > maxX && currentX !== startX) {
          currentX = startX;
          currentY = snap(currentY + rowHeight + gap);
          rowHeight = 0;
        }

        const next = {
          ...node,
          x: snap(currentX),
          y: snap(currentY)
        };

        currentX = snap(currentX + size.width + gap);
        rowHeight = Math.max(rowHeight, size.height);
        return next;
      });
    });
  };

  useEffect(() => {
    return () => {
      imageBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      imageBlobUrlsRef.current.clear();
    };
  }, []);

  return {
    nodes,
    aiVisible,
    coords,
    draggingId,
    setAiVisible,
    uploadFiles,
    addThoughtNode,
    removeNode,
    renameNode,
    onMouseDownNode,
    onMouseMoveCanvas,
    organizeFiles
  };
}

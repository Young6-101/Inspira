import type { NodeType, WorkspaceNodeData } from '../types/workspace';

type OrganizeWorkspaceNodesParams = {
  nodes: WorkspaceNodeData[];
  aiVisible: boolean;
  viewportWidth: number;
};

const snap = (value: number): number => Math.round(value / 40) * 40;

export function organizeWorkspaceNodes({ nodes, aiVisible, viewportWidth }: OrganizeWorkspaceNodesParams): WorkspaceNodeData[] {
  const startX = 80;
  const startY = 80;
  const gap = 40;
  const rightGutter = aiVisible ? 440 : 80;
  const viewportUsableWidth = Math.max(360, viewportWidth - rightGutter);
  const maxX = Math.max(520, viewportUsableWidth);

  const sizeByType: Record<NodeType, { width: number; height: number }> = {
    text: { width: 256, height: 170 },
    image: { width: 256, height: 255 },
    audio: { width: 288, height: 96 },
    presentation: { width: 360, height: 230 },
    document: { width: 280, height: 430 },
    video: { width: 420, height: 280 },
    url: { width: 320, height: 150 }
  };

  const sorted = [...nodes].sort((a, b) => (a.y - b.y) || (a.x - b.x));

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
}

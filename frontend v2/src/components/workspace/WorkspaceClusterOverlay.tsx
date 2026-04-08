import { useState } from 'react';
import type { ClusterEdgeData, ClusterNodeData, WorkspaceNodeData } from '../../types/workspace';
import type { MouseEvent as ReactMouseEvent } from 'react';

type WorkspaceClusterOverlayProps = {
  nodes: WorkspaceNodeData[];
  clusterNodes: ClusterNodeData[];
  clusterEdges: ClusterEdgeData[];
  clusterStage: 0 | 1 | 2 | 3;
  onMouseDownCluster?: (id: string, e: ReactMouseEvent, cluster: ClusterNodeData) => void;
};

export default function WorkspaceClusterOverlay({ nodes, clusterNodes, clusterEdges, clusterStage, onMouseDownCluster }: WorkspaceClusterOverlayProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  if (clusterStage <= 0) {
    return null;
  }

  const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const dynamicTextHeight = Math.min(
      420,
      150 + Math.ceil(((node.textPreview || '').trim().split(/\s+/).filter(Boolean).length || 0) / 12) * 20
    );

    const sizeByType: Record<string, { width: number; height: number }> = {
      text: { width: 256, height: Math.max(170, dynamicTextHeight) },
      image: { width: 256, height: 255 },
      audio: { width: 288, height: 96 },
      presentation: { width: 360, height: 230 },
      document: { width: 280, height: 430 },
      video: { width: 420, height: 280 },
      url: { width: 320, height: 150 }
    };

    const size = sizeByType[node.type] ?? { width: 280, height: 180 };
    return {
      x: node.x + size.width / 2,
      y: node.y + size.height / 2
    };
  };

  const getClusterCenter = (clusterId: string): { x: number; y: number } | null => {
    const cluster = clusterNodes.find((c) => c.id === clusterId);
    if (!cluster) return null;
    return {
      x: cluster.x + 120,
      y: cluster.y + 46
    };
  };

  const visibleEdges = clusterEdges.filter((edge) => {
    if (edge.kind === 'membership') return clusterStage >= 2;
    return clusterStage >= 3;
  });

  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-auto z-10" aria-hidden>
        {visibleEdges.map((edge) => {
          const from = edge.sourceKind === 'node' ? getNodeCenter(edge.sourceId) : getClusterCenter(edge.sourceId);
          const to = getClusterCenter(edge.targetId);
          if (!from || !to) return null;

          const isHovered = hoveredEdgeId === edge.id;

          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isHovered ? '#ff6b5b' : edge.kind === 'membership' ? '#111' : '#00d4aa'}
              strokeWidth={edge.kind === 'membership' ? 1.5 : Math.min(4, 1.2 + edge.weight * 0.7)}
              strokeDasharray={edge.kind === 'membership' ? '4 4' : '0'}
              opacity={isHovered ? 1 : edge.kind === 'membership' ? 0.55 : 0.9}
              onMouseEnter={() => setHoveredEdgeId(edge.id)}
              onMouseLeave={() => setHoveredEdgeId((prev) => (prev === edge.id ? null : prev))}
            />
          );
        })}
      </svg>

      {clusterNodes.map((cluster) => (
        <div
          key={cluster.id}
          className={`absolute z-20 w-[240px] px-4 py-3 border-2 border-textBlack bg-white shadow-[4px_4px_0px_#111] cursor-grab active:cursor-grabbing ${cluster.tone === 'theme' ? 'bg-accentViolet/10' : 'bg-accentElectric/10'}`}
          style={{ left: `${cluster.x}px`, top: `${cluster.y}px` }}
          onMouseDown={(e) => onMouseDownCluster?.(cluster.id, e, cluster)}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{cluster.tone}</div>
          <div className="text-sm font-bold leading-tight">{cluster.label}</div>
          {cluster.keywords && cluster.keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.keywords.slice(0, 4).map((keyword) => (
                <span key={`${cluster.id}-${keyword}`} className="text-[9px] font-bold uppercase tracking-widest border border-textBlack px-1.5 py-0.5 bg-white/80">
                  {keyword}
                </span>
              ))}
            </div>
          )}
          <div className="text-[11px] font-medium text-gray-600 mt-1">{cluster.nodeIds.length} connected nodes</div>
        </div>
      ))}
    </>
  );
}

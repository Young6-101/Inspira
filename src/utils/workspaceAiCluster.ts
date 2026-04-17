import type { ClusterEdgeData, ClusterNodeData, WorkspaceNodeData } from '../types/workspace';

type BuildClusterGraphResult = {
  clusters: ClusterNodeData[];
  edges: ClusterEdgeData[];
};

type AIStreamEvent = {
  step?: string;
  stage?: number;
  clusters?: any[];
  relations?: any[];
  error?: string;
};

function layoutCluster(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 960 + col * 320,
    y: 220 + row * 220
  };
}

export async function buildClusterGraphWithAI(
  nodes: WorkspaceNodeData[],
  stackId: string | undefined,
  onStep?: (msg: string, stage: number) => void
): Promise<BuildClusterGraphResult> {
  if (nodes.length === 0) return { clusters: [], edges: [] };

  try {
    // Mock API delay and steps
    if (onStep) {
      onStep("Mocking clustering initialization...", 1);
      await new Promise(res => setTimeout(res, 500));
      onStep("Mocking semantic grouping...", 2);
      await new Promise(res => setTimeout(res, 500));
      onStep("Complete", 3);
    }

    const validNodeIdSet = new Set(nodes.map((n) => n.id));
    const clusters: ClusterNodeData[] = [];

    // Group all nodes artificially into one mock cluster for demonstration
    if (nodes.length > 0) {
      const pos = layoutCluster(0);
      clusters.push({
        id: `mock-ai-0`,
        label: `Mock Group (${nodes.length})`,
        keywords: ["Mock", "Demo", "Local"],
        x: pos.x,
        y: pos.y,
        nodeIds: Array.from(validNodeIdSet),
        tone: 'theme'
      });
    }

    const membershipEdges: ClusterEdgeData[] = clusters.flatMap((cluster) =>
      cluster.nodeIds.map((nodeId) => ({
        id: `m-${nodeId}-${cluster.id}`,
        kind: 'membership' as const,
        sourceId: nodeId,
        sourceKind: 'node' as const,
        targetId: cluster.id,
        targetKind: 'cluster' as const,
        weight: 1
      }))
    );

    return { clusters, edges: membershipEdges };
  } catch (err) {
    console.error('Clustering error:', err);
    return { clusters: [], edges: [] };
  }
}

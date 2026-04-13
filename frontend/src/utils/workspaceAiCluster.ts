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
  onStep?: (msg: string, stage: number) => void
): Promise<BuildClusterGraphResult> {
  if (nodes.length === 0) return { clusters: [], edges: [] };

  try {
    const meta = (import.meta as any);
    const apiUrl = (meta.env && meta.env.VITE_API_URL) || 'http://localhost:8000';

    const res = await fetch(`${apiUrl}/ai/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes })
    });

    if (!res.ok) throw new Error('Backend clustering failed');

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No body');

    const decoder = new TextDecoder();
    let finalData: AIStreamEvent | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: AIStreamEvent = JSON.parse(line.slice(6));
          if (event.step && onStep) {
            onStep(event.step, event.stage || 2);
          }
          if (event.stage === 3) {
            finalData = event;
          }
        } catch (e) { }
      }
    }

    if (!finalData || !finalData.clusters) return { clusters: [], edges: [] };

    // Normalize results
    const validNodeIdSet = new Set(nodes.map((n) => n.id));

    // Explicitly define clusters to satisfy TS
    const clusters: ClusterNodeData[] = [];
    finalData.clusters.forEach((c, i) => {
      const uniqueNodeIds = c.nodeIds.filter((id: string) => validNodeIdSet.has(id));
      if (uniqueNodeIds.length >= 2) {
        const pos = layoutCluster(i);
        clusters.push({
          id: c.id || `ai-${i}`,
          label: `${c.label} (${uniqueNodeIds.length})`,
          keywords: (c.keywords || []) as string[],
          x: pos.x,
          y: pos.y,
          nodeIds: uniqueNodeIds,
          tone: 'theme'
        });
      }
    });

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

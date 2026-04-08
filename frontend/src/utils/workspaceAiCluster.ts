import type { ClusterEdgeData, ClusterNodeData, WorkspaceNodeData } from '../types/workspace';

type BuildClusterGraphResult = {
  clusters: ClusterNodeData[];
  edges: ClusterEdgeData[];
};

type AIClusterResponse = {
  steps?: string[];
  finalAnswer?: string;
  clusters: Array<{
    keywords: string[];
    label?: string;
    nodeIds: string[];
  }>;
  relations?: Array<{
    fromIndex: number;
    toIndex: number;
    weight: number;
  }>;
};

function tryExtractJson(text: string): AIClusterResponse | null {
  const raw = text.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AIClusterResponse;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as AIClusterResponse;
    } catch {
      return null;
    }
  }
}

function layoutCluster(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: 960 + col * 320,
    y: 220 + row * 220
  };
}

function deriveKeywordsFromLabel(label?: string): string[] {
  if (!label) return [];
  return label
    .split(/[|,;/\\\-•]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeAIResult(ai: AIClusterResponse, sourceNodes: WorkspaceNodeData[]): BuildClusterGraphResult | null {
  if (!Array.isArray(ai.clusters) || ai.clusters.length === 0) return null;

  const validNodeIdSet = new Set(sourceNodes.map((n) => n.id));

  const mappedClusters: Array<ClusterNodeData | null> = ai.clusters
    .map((cluster, index) => {
      const uniqueNodeIds = Array.from(new Set(cluster.nodeIds)).filter((id) => validNodeIdSet.has(id));
      const explicitKeywords = Array.isArray(cluster.keywords)
        ? cluster.keywords.filter((word): word is string => typeof word === 'string').map((word) => word.trim()).filter(Boolean)
        : [];
      const keywords = explicitKeywords.length > 0 ? explicitKeywords : deriveKeywordsFromLabel(cluster.label);

      if (keywords.length === 0 || uniqueNodeIds.length < 2) return null;

      const pos = layoutCluster(index);
      const clusterTitle = keywords.slice(0, 3).join(' · ');
      return {
        id: `ai-cluster-${index + 1}`,
        label: `${clusterTitle || cluster.label || 'semantic cluster'} (${uniqueNodeIds.length})`,
        keywords,
        x: pos.x,
        y: pos.y,
        nodeIds: uniqueNodeIds,
        tone: 'theme' as const
      };
    });

  const clusters: ClusterNodeData[] = mappedClusters.filter((item): item is ClusterNodeData => item !== null);

  if (clusters.length === 0) return null;

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

  const relationEdges: ClusterEdgeData[] = [];
  (ai.relations ?? []).forEach((rel) => {
    const from = clusters[rel.fromIndex];
    const to = clusters[rel.toIndex];
    if (!from || !to || from.id === to.id) return;

    relationEdges.push({
      id: `r-${from.id}-${to.id}`,
      kind: 'relationship',
      sourceId: from.id,
      sourceKind: 'cluster',
      targetId: to.id,
      targetKind: 'cluster',
      weight: Math.max(1, Math.min(5, Number.isFinite(rel.weight) ? rel.weight : 1))
    });
  });

  return { clusters, edges: [...membershipEdges, ...relationEdges] };
}

export async function buildClusterGraphWithAI(nodes: WorkspaceNodeData[]): Promise<BuildClusterGraphResult> {
  if (nodes.length === 0) return { clusters: [], edges: [] };

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    return { clusters: [], edges: [] };
  }

  const compactNodes = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    label: node.label ?? '',
    textPreview: (node.textPreview ?? '').slice(0, 480),
    url: node.url ?? ''
  }));

  const prompt = [
    'You are an AI planner for a creative workspace.',
    'Task order:',
    '1) Aggregate semantically similar nodes first.',
    '2) For each group, output concise keywords. Keywords represent the cluster node.',
    '3) Map each cluster to nodeIds and optional inter-cluster relations.',
    '4) Provide a precise, non-redundant final answer.',
    'Important: NEVER cluster by file type only.',
    'You must output ONLY strict JSON (no markdown).',
    'Schema:',
    '{',
    '  "steps": string[],',
    '  "clusters": [{ "keywords": string[], "label"?: string, "nodeIds": string[] }],',
    '  "relations"?: [{ "fromIndex": number, "toIndex": number, "weight": number }],',
    '  "finalAnswer"?: string',
    '}',
    'Rules:',
    '- Keep each cluster semantically coherent.',
    '- Minimum 2 nodes per cluster.',
    '- keywords should be short and descriptive (2-6 words each).',
    '- A node can belong to multiple clusters when justified.',
    '- Prefer 2-8 clusters total.',
    '- relations are conceptual influence links between clusters (weight 1-5).',
    '- fromIndex/toIndex reference positions in the clusters array.',
    'Nodes:',
    JSON.stringify(compactNodes)
  ].join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: prompt,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      return { clusters: [], edges: [] };
    }

    const data = await res.json();
    const text =
      (typeof data.output_text === 'string' && data.output_text) ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap((item: any) => (Array.isArray(item.content) ? item.content : []))
            .map((c: any) => c.text || '')
            .join('\n')
        : '');

    const parsed = tryExtractJson(text);
    if (!parsed) {
      return { clusters: [], edges: [] };
    }

    const normalized = normalizeAIResult(parsed, nodes);
    if (!normalized) {
      return { clusters: [], edges: [] };
    }

    return normalized;
  } catch {
    return { clusters: [], edges: [] };
  }
}

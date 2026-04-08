import type { ClusterEdgeData, ClusterNodeData, NodeType, WorkspaceNodeData } from '../types/workspace';

type BuildClusterGraphResult = {
  clusters: ClusterNodeData[];
  edges: ClusterEdgeData[];
};

export function buildClusterGraph(nodes: WorkspaceNodeData[]): BuildClusterGraphResult {
  if (nodes.length === 0) {
    return { clusters: [], edges: [] };
  }

  const typeBuckets = new Map<string, WorkspaceNodeData[]>();
  nodes.forEach((node) => {
    const key = `type:${node.type}`;
    const bucket = typeBuckets.get(key) ?? [];
    bucket.push(node);
    typeBuckets.set(key, bucket);
  });

  const themeMatchers: Array<{ id: string; label: string; words: string[] }> = [
    { id: 'theme-poster', label: 'Poster Direction', words: ['poster', '海报', 'layout', 'grid', 'print'] },
    { id: 'theme-color', label: 'Color Language', words: ['color', 'colour', 'palette', '配色', 'contrast'] },
    { id: 'theme-copy', label: 'Copy & Slogan', words: ['copy', 'slogan', 'headline', '文案', '标题', 'tagline'] },
    { id: 'theme-motion', label: 'Motion Rhythm', words: ['motion', 'dynamic', 'video', 'tempo', '动效'] },
    { id: 'theme-audience', label: 'Audience Signal', words: ['audience', 'persona', 'user', '目标用户', '人群'] }
  ];

  const themeBuckets = new Map<string, WorkspaceNodeData[]>();
  nodes.forEach((node) => {
    const corpus = `${node.label ?? ''} ${node.textPreview ?? ''} ${node.url ?? ''}`.toLowerCase();
    themeMatchers.forEach((matcher) => {
      if (matcher.words.some((word) => corpus.includes(word.toLowerCase()))) {
        const bucket = themeBuckets.get(matcher.id) ?? [];
        bucket.push(node);
        themeBuckets.set(matcher.id, bucket);
      }
    });
  });

  const clusters: ClusterNodeData[] = [];
  const typeLabels: Record<NodeType, string> = {
    text: 'Text Insights',
    image: 'Image References',
    audio: 'Audio Cues',
    presentation: 'Slides Structure',
    document: 'Document Evidence',
    video: 'Video References',
    url: 'URL Sources'
  };

  Array.from(typeBuckets.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([key, bucket], index) => {
      const type = key.replace('type:', '') as NodeType;
      const col = index % 3;
      const row = Math.floor(index / 3);
      clusters.push({
        id: key,
        label: `${typeLabels[type]} (${bucket.length})`,
        x: 820 + col * 320,
        y: 160 + row * 220,
        nodeIds: bucket.map((n) => n.id),
        tone: 'type'
      });
    });

  Array.from(themeBuckets.entries())
    .filter(([, bucket]) => bucket.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .forEach(([id, bucket], index) => {
      const matcher = themeMatchers.find((m) => m.id === id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      clusters.push({
        id,
        label: `${matcher?.label ?? 'Theme'} (${bucket.length})`,
        x: 980 + col * 320,
        y: 720 + row * 220,
        nodeIds: bucket.map((n) => n.id),
        tone: 'theme'
      });
    });

  const membershipEdges: ClusterEdgeData[] = clusters.flatMap((cluster) =>
    cluster.nodeIds.map((nodeId) => ({
      id: `m-${nodeId}-${cluster.id}`,
      kind: 'membership',
      sourceId: nodeId,
      sourceKind: 'node',
      targetId: cluster.id,
      targetKind: 'cluster',
      weight: 1
    }))
  );

  const relationEdges: ClusterEdgeData[] = [];
  for (let i = 0; i < clusters.length; i += 1) {
    for (let j = i + 1; j < clusters.length; j += 1) {
      const left = clusters[i];
      const right = clusters[j];
      const overlapCount = left.nodeIds.filter((id) => right.nodeIds.includes(id)).length;
      if (overlapCount > 0) {
        relationEdges.push({
          id: `r-${left.id}-${right.id}`,
          kind: 'relationship',
          sourceId: left.id,
          sourceKind: 'cluster',
          targetId: right.id,
          targetKind: 'cluster',
          weight: overlapCount
        });
      }
    }
  }

  return {
    clusters,
    edges: [...membershipEdges, ...relationEdges]
  };
}

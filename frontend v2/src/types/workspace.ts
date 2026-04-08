export type NodeType = 'text' | 'image' | 'audio' | 'presentation' | 'document' | 'video' | 'url';

export type ClusterNodeData = {
  id: string;
  label: string;
  keywords?: string[];
  x: number;
  y: number;
  nodeIds: string[];
  tone: 'type' | 'theme';
};

export type ClusterEdgeData = {
  id: string;
  kind: 'membership' | 'relationship';
  sourceId: string;
  sourceKind: 'node' | 'cluster';
  targetId: string;
  targetKind: 'cluster';
  weight: number;
};

export type WorkspaceNodeData = {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  textPreview?: string;
  imageSrc?: string;
  url?: string;
};

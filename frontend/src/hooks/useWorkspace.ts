import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ClusterEdgeData, ClusterNodeData, WorkspaceNodeData } from '../types/workspace';
import { buildClusterGraphWithAI } from '../utils/workspaceAiCluster';
import { buildWorkspaceNodesFromFiles, filterAcceptedFiles } from '../utils/workspaceFiles';
import { organizeWorkspaceNodes } from '../utils/workspaceLayout';

const getApiBaseUrl = (): string => {
  const envApiUrl = (import.meta as any).env.VITE_API_URL;
  return envApiUrl || ((import.meta as any).env.DEV ? '/api' : 'http://127.0.0.1:8000');
};

export default function useWorkspace(stackId?: string) {
  const [nodes, setNodes] = useState<WorkspaceNodeData[]>([]);
  const [aiVisible, setAiVisible] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingClusterId, setDraggingClusterId] = useState<string | null>(null);
  const [clustersManuallyMoved, setClustersManuallyMoved] = useState(() => {
    if (!stackId) return false;
    try { return localStorage.getItem(`inspira_cluster_moved_${stackId}`) === 'true'; } catch { return false; }
  });
  const [clusterNodes, setClusterNodes] = useState<ClusterNodeData[]>(() => {
    if (!stackId) return [];
    try { const saved = localStorage.getItem(`inspira_clusters_${stackId}`); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [clusterEdges, setClusterEdges] = useState<ClusterEdgeData[]>(() => {
    if (!stackId) return [];
    try { const saved = localStorage.getItem(`inspira_edges_${stackId}`); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [clusterStage, setClusterStage] = useState<0 | 1 | 2 | 3>(() => {
    if (!stackId) return 0;
    try { const saved = localStorage.getItem(`inspira_cluster_stage_${stackId}`); return saved ? parseInt(saved, 10) as any : 0; } catch { return 0; }
  });

  useEffect(() => {
    if (!stackId) return;
    if (clusterNodes.length > 0 || localStorage.getItem(`inspira_clusters_${stackId}`)) {
      localStorage.setItem(`inspira_cluster_moved_${stackId}`, String(clustersManuallyMoved));
      localStorage.setItem(`inspira_clusters_${stackId}`, JSON.stringify(clusterNodes));
      localStorage.setItem(`inspira_edges_${stackId}`, JSON.stringify(clusterEdges));
      localStorage.setItem(`inspira_cluster_stage_${stackId}`, String(clusterStage));
    }
  }, [clusterNodes, clusterEdges, clusterStage, clustersManuallyMoved, stackId]);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const clusterDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageBlobUrlsRef = useRef<Set<string>>(new Set());
  const clusterTimersRef = useRef<number[]>([]);

  const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';

  const snap = (value: number): number => Math.round(value / 40) * 40;

  const limitWords = (input: string, maxWords = 100): string => {
    const words = input.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      return input.trim();
    }
    return words.slice(0, maxWords).join(' ');
  };

  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isLikelyUrl = (input: string): boolean => {
    const normalized = normalizeUrl(input);
    if (!normalized) return false;
    try {
      const parsed = new URL(normalized);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
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

  useEffect(() => {
    if (!stackId) return;
    const loadStack = async () => {
      try {
        const res = await fetch(`${apiUrl}/stacks/${stackId}/files`);
        if (!res.ok) throw new Error('API errored');
        const files: any[] = await res.json();
        if (!Array.isArray(files)) return;

        const restoredNodes = files.map((f, i) => {
          const pos = getNextPosition(i);
          return {
            id: f.id,
            type: f.type === 'url' ? 'url' : f.type === 'text' ? 'text' : f.type === 'image' ? 'image' : 'file',
            label: f.label || f.filename,
            x: pos.x,
            y: pos.y,
            url: f.type === 'url' ? f.text_preview : undefined,
            textPreview: f.text_preview || f.filename,
            imageSrc: f.type === 'image' ? `${apiUrl}/uploads/${stackId}_${f.filename}` : undefined
          } as WorkspaceNodeData;
        });
        setNodes(restoredNodes);
      } catch (err) {
        console.error("Failed to restore nodes:", err);
      }
    };
    loadStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackId, apiUrl]);

  const layoutClustersNearAiPanel = (input: ClusterNodeData[], viewportWidth: number, aiPanelVisible: boolean): ClusterNodeData[] => {
    const panelWidth = aiPanelVisible ? 480 : 0;
    const clusterWidth = 240;
    const rightMargin = 24;
    const startY = 120;
    const gapY = 170;
    const x = Math.max(520, viewportWidth - panelWidth - clusterWidth - rightMargin);

    return input.map((cluster, index) => ({
      ...cluster,
      x: snap(x),
      y: snap(startY + index * gapY)
    }));
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

    const accepted = filterAcceptedFiles(source);
    if (accepted.length === 0) return;

    const result = await buildWorkspaceNodesFromFiles({
      files: accepted,
      startIndex: nodes.length,
      getNextPosition,
      limitWords
    });

    result.imageUrls.forEach((url) => imageBlobUrlsRef.current.add(url));
    setNodes((prev) => [...prev, ...result.nodes]);

    // 🌟 后台静默发送给 API，让大模型吃透文件内容
    if (stackId) {
      accepted.forEach((file) => {
        const formData = new FormData();
        formData.append('file', file);
        fetch(`${apiUrl}/stacks/${stackId}/files`, {
          method: 'POST',
          body: formData
        }).catch(err => console.error("Upload to backend failed", err));
      });
    }
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

    // 🌟 后台静默上传文字节点
    if (stackId) {
      fetch(`${apiUrl}/stacks/${stackId}/files/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: normalized, label: 'thought.txt' })
      }).catch(err => console.error("Add text to backend failed", err));
    }
  };

  const addUrlNode = (rawUrl: string) => {
    const normalized = normalizeUrl(rawUrl);
    if (!isLikelyUrl(normalized)) return;

    const pos = getNextPosition(nodes.length);
    const nextNode: WorkspaceNodeData = {
      id: crypto.randomUUID(),
      type: 'url',
      x: pos.x,
      y: pos.y,
      label: 'URL_NODE',
      url: normalized
    };

    setNodes((prev) => [...prev, nextNode]);

    // 🌟 后台静默上传 URL 节点
    if (stackId) {
      fetch(`${apiUrl}/stacks/${stackId}/files/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, label: 'link.url' })
      }).catch(err => console.error("Add URL to backend failed", err));
    }
  };

  const onMouseDownNode = (id: string, e: ReactMouseEvent, node: WorkspaceNodeData) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDraggingId(id);
    dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
  };

  const onMouseDownCluster = (id: string, e: ReactMouseEvent, cluster: ClusterNodeData) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setDraggingClusterId(id);
    setClustersManuallyMoved(true);
    clusterDragOffset.current = { x: e.clientX - cluster.x, y: e.clientY - cluster.y };
  };

  const onMouseMoveCanvas = (e: ReactMouseEvent, canvasRect: DOMRect) => {
    const relX = Math.round(e.clientX - canvasRect.left);
    const relY = Math.round(e.clientY - canvasRect.top);
    setCoords({ x: relX, y: relY });

    if (draggingClusterId && e.buttons === 1) {
      const nx = e.clientX - canvasRect.left - clusterDragOffset.current.x;
      const ny = e.clientY - canvasRect.top - clusterDragOffset.current.y;
      setClusterNodes((prev) => prev.map((n) => (n.id === draggingClusterId ? { ...n, x: nx, y: ny } : n)));
      return;
    }

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

  useEffect(() => {
    if (!draggingClusterId) return;
    const finish = () => {
      setClusterNodes((prev) => prev.map((n) => (n.id === draggingClusterId ? { ...n, x: snap(n.x), y: snap(n.y) } : n)));
      setDraggingClusterId(null);
    };
    window.addEventListener('mouseup', finish);
    return () => window.removeEventListener('mouseup', finish);
  }, [draggingClusterId]);

  const organizeFiles = () => {
    setDraggingId(null);
    setDraggingClusterId(null);

    setNodes((prev) => organizeWorkspaceNodes({ nodes: prev, aiVisible, viewportWidth: window.innerWidth }));
  };

  const clearClusterAnimation = () => {
    clusterTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    clusterTimersRef.current = [];
  };

  const runClusterGraph = async () => {
    clearClusterAnimation();

    if (nodes.length === 0) {
      setClusterNodes([]);
      setClusterEdges([]);
      setClusterStage(0);
      return;
    }

    const graph = await buildClusterGraphWithAI(nodes, stackId);
    setClustersManuallyMoved(false);
    setClusterNodes(layoutClustersNearAiPanel(graph.clusters, window.innerWidth, aiVisible));
    setClusterEdges(graph.edges);

    if (graph.clusters.length === 0) {
      setClusterStage(0);
      return;
    }

    setClusterStage(1);

    const t1 = window.setTimeout(() => setClusterStage(2), 500);
    const t2 = window.setTimeout(() => setClusterStage(3), 1100);
    clusterTimersRef.current = [t1, t2];
  };

  const clearClusterGraph = () => {
    clearClusterAnimation();
    setDraggingClusterId(null);
    setClustersManuallyMoved(false);
    setClusterStage(0);
    setClusterNodes([]);
    setClusterEdges([]);
  };

  useEffect(() => {
    if (clusterNodes.length === 0 || clustersManuallyMoved) return;

    const relayout = () => {
      setClusterNodes((prev) => layoutClustersNearAiPanel(prev, window.innerWidth, aiVisible));
    };

    relayout();
    window.addEventListener('resize', relayout);
    return () => window.removeEventListener('resize', relayout);
  }, [aiVisible, clusterNodes.length, clustersManuallyMoved]);

  useEffect(() => {
    return () => {
      clearClusterAnimation();
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
    addUrlNode,
    removeNode,
    renameNode,
    onMouseDownNode,
    onMouseDownCluster,
    onMouseMoveCanvas,
    organizeFiles,
    clusterNodes,
    clusterEdges,
    clusterStage,
    runClusterGraph,
    clearClusterGraph
  };
}

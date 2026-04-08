import type { WorkspaceNodeData } from '../types/workspace';

type Position = { x: number; y: number };

type BuildWorkspaceNodesParams = {
  files: File[];
  startIndex: number;
  getNextPosition: (index: number) => Position;
  limitWords: (input: string, maxWords?: number) => string;
};

type BuildWorkspaceNodesResult = {
  nodes: WorkspaceNodeData[];
  imageUrls: string[];
};

const ACCEPTED_EXTENSIONS = [
  '.txt',
  '.jpg',
  '.jpeg',
  '.mp3',
  '.flac',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.pdf',
  '.mp4',
  '.mov',
  '.webm',
  '.url'
] as const;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseUrlShortcut(content: string): string {
  const line = content
    .split(/\r?\n/)
    .find((part) => part.trim().toLowerCase().startsWith('url='));
  if (!line) return '';
  return normalizeUrl(line.slice(line.indexOf('=') + 1));
}

export function filterAcceptedFiles(files: File[]): File[] {
  return files.filter((file) => {
    const name = file.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  });
}

export async function buildWorkspaceNodesFromFiles({ files, startIndex, getNextPosition, limitWords }: BuildWorkspaceNodesParams): Promise<BuildWorkspaceNodesResult> {
  const nodes: WorkspaceNodeData[] = [];
  const imageUrls: string[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const lower = file.name.toLowerCase();
    const pos = getNextPosition(startIndex + i);

    if (lower.endsWith('.txt')) {
      const rawText = await file.text();
      const textPreview = limitWords(rawText) || 'Empty text file';
      nodes.push({
        id: crypto.randomUUID(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        label: file.name,
        textPreview
      });
      continue;
    }

    if (lower.endsWith('.url')) {
      const raw = await file.text();
      const parsed = parseUrlShortcut(raw);
      nodes.push({
        id: crypto.randomUUID(),
        type: 'url',
        x: pos.x,
        y: pos.y,
        label: file.name,
        url: parsed || undefined,
        textPreview: parsed ? undefined : 'Invalid .url file'
      });
      continue;
    }

    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) {
      nodes.push({
        id: crypto.randomUUID(),
        type: 'presentation',
        x: pos.x,
        y: pos.y,
        label: file.name
      });
      continue;
    }

    if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.pdf')) {
      nodes.push({
        id: crypto.randomUUID(),
        type: 'document',
        x: pos.x,
        y: pos.y,
        label: file.name
      });
      continue;
    }

    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
      nodes.push({
        id: crypto.randomUUID(),
        type: 'video',
        x: pos.x,
        y: pos.y,
        label: file.name
      });
      continue;
    }

    if (lower.endsWith('.mp3') || lower.endsWith('.flac')) {
      nodes.push({
        id: crypto.randomUUID(),
        type: 'audio',
        x: pos.x,
        y: pos.y,
        label: file.name
      });
      continue;
    }

    const imageSrc = URL.createObjectURL(file);
    imageUrls.push(imageSrc);
    nodes.push({
      id: crypto.randomUUID(),
      type: 'image',
      x: pos.x,
      y: pos.y,
      label: file.name,
      imageSrc
    });
  }

  return { nodes, imageUrls };
}

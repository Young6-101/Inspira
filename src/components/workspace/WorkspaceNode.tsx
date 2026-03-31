import type { CSSProperties, MouseEventHandler } from 'react';
import AudioNode from './AudioNode.tsx';
import DocumentNode from './DocumentNode.tsx';
import ImageNode from './ImageNode.tsx';
import PresentationNode from './PresentationNode.tsx';
import TextNode from './TextNode.tsx';
import VideoNode from './VideoNode.tsx';
import type { WorkspaceNodeData } from '../../hooks/useWorkspace';

type WorkspaceNodeProps = {
  node: WorkspaceNodeData;
  dragging: boolean;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onDelete: () => void;
  onRename: (nextLabel: string) => void;
};

export default function WorkspaceNode({ node, dragging, onMouseDown, onDelete, onRename }: WorkspaceNodeProps) {
  const commonProps: { className: string; style: CSSProperties; onMouseDown: MouseEventHandler<HTMLDivElement> } = {
    className: `workspace-item group ${dragging ? 'is-moving' : ''}`,
    style: { left: `${node.x}px`, top: `${node.y}px` },
    onMouseDown
  };

  if (node.type === 'image') {
    return (
      <div {...commonProps}>
        <ImageNode onDelete={onDelete} label={node.label} imageSrc={node.imageSrc} onRename={onRename} />
      </div>
    );
  }

  if (node.type === 'audio') {
    return (
      <div {...commonProps}>
        <AudioNode onDelete={onDelete} label={node.label} onRename={onRename} />
      </div>
    );
  }

  if (node.type === 'presentation') {
    return (
      <div {...commonProps}>
        <PresentationNode onDelete={onDelete} label={node.label} onRename={onRename} />
      </div>
    );
  }

  if (node.type === 'document') {
    return (
      <div {...commonProps}>
        <DocumentNode onDelete={onDelete} label={node.label} onRename={onRename} />
      </div>
    );
  }

  if (node.type === 'video') {
    return (
      <div {...commonProps}>
        <VideoNode onDelete={onDelete} label={node.label} onRename={onRename} />
      </div>
    );
  }

  return (
    <div {...commonProps}>
      <TextNode onDelete={onDelete} label={node.label} textPreview={node.textPreview} onRename={onRename} />
    </div>
  );
}

import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AIPanel from '../components/workspace/AIPanel.tsx';
import ThoughtInputModal from '../components/workspace/ThoughtInputModal.tsx';
import WorkspaceClusterOverlay from '../components/workspace/WorkspaceClusterOverlay.tsx';
import WorkspaceFileUploadInput from '../components/workspace/WorkspaceFileUploadInput.tsx';
import WorkspaceNode from '../components/workspace/WorkspaceNode.tsx';
import WorkspaceToolbar from '../components/workspace/WorkspaceToolbar.tsx';
import URLInputModal from '../components/workspace/URLInputModal.tsx';
import useWorkspace from '../hooks/useWorkspace.ts';

type WorkspacePageProps = {
  currentStackLabel?: string;
};

export default function WorkspacePage({ currentStackLabel = '' }: WorkspacePageProps) {
  const { stackId } = useParams<{ stackId: string }>();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isThoughtOpen, setIsThoughtOpen] = useState(false);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const {
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
  } = useWorkspace(stackId);

  return (
    <div className="absolute inset-0 flex border-t border-textBlack">
      <div className={`flex-1 relative overflow-hidden transition-all duration-300 ${aiVisible ? 'border-r border-textBlack' : ''}`}>
        <div
          id="workspace-canvas"
          ref={canvasRef}
          onMouseMove={(e) => canvasRef.current && onMouseMoveCanvas(e, canvasRef.current.getBoundingClientRect())}
          className="absolute inset-0 w-[4000px] h-[4000px]"
        >
          <WorkspaceClusterOverlay
            nodes={nodes}
            clusterNodes={clusterNodes}
            clusterEdges={clusterEdges}
            clusterStage={clusterStage}
            onMouseDownCluster={onMouseDownCluster}
          />

          {nodes.map((node) => (
            <WorkspaceNode
              key={node.id}
              node={node}
              dragging={draggingId === node.id}
              onDelete={() => removeNode(node.id)}
              onRename={(nextLabel) => renameNode(node.id, nextLabel)}
              onMouseDown={(e) => onMouseDownNode(node.id, e, node)}
            />
          ))}
        </div>

        <WorkspaceToolbar
          onTypeThoughts={() => setIsThoughtOpen(true)}
          onInputUrl={() => setIsUrlInputOpen(true)}
          onAdd={() => fileInputRef.current?.click()}
          onOrganize={organizeFiles}
          onCluster={runClusterGraph}
          onClearCluster={clearClusterGraph}
          clusterActive={clusterStage > 0}
          aiVisible={aiVisible}
          onToggleAi={() => setAiVisible((v: boolean) => !v)}
        />

        <ThoughtInputModal
          isOpen={isThoughtOpen}
          onClose={() => setIsThoughtOpen(false)}
          onSubmit={(thought) => addThoughtNode(thought)}
        />

        <URLInputModal
          isOpen={isUrlInputOpen}
          onClose={() => setIsUrlInputOpen(false)}
          onSubmit={(url) => addUrlNode(url)}
        />

        <WorkspaceFileUploadInput inputRef={fileInputRef} onUpload={uploadFiles} />

        <div className="absolute top-6 left-6 flex gap-2">
          {currentStackLabel ? (
            <div className="bg-accentElectric/20 border-2 border-textBlack px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_#111]">
              Label: <span className="text-accentViolet">{currentStackLabel}</span>
            </div>
          ) : null}
          <div className="bg-white border-2 border-textBlack px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_#111]">
            X: <span className="text-accentCoral">{String(coords.x).padStart(3, '0')}</span> Y: <span className="text-accentElectric">{String(coords.y).padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      <AIPanel visible={aiVisible} onClose={() => setAiVisible(false)} stackId={stackId} workspaceNodes={nodes} onGenerateClusters={runClusterGraph} />
    </div>
  );
}

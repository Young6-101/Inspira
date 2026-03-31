import { useState, useRef } from 'react';
import AIPanel from '../components/workspace/AIPanel.tsx';
import ThoughtInputModal from '../components/workspace/ThoughtInputModal.tsx';
import WorkspaceNode from '../components/workspace/WorkspaceNode.tsx';
import WorkspaceToolbar from '../components/workspace/WorkspaceToolbar.tsx';
import useWorkspace from '../hooks/useWorkspace.ts';

export default function WorkspacePage() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isThoughtOpen, setIsThoughtOpen] = useState(false);
  const {
    nodes,
    aiVisible,
    coords,
    draggingId,
    setAiVisible,
    uploadFiles,
    addThoughtNode,
    removeNode,
    renameNode,
    onMouseDownNode,
    onMouseMoveCanvas,
    organizeFiles
  } = useWorkspace();

  return (
    <div className="absolute inset-0 flex border-t border-textBlack">
      <div className={`flex-1 relative overflow-hidden transition-all duration-300 ${aiVisible ? 'border-r border-textBlack' : ''}`}>
        <div
          id="workspace-canvas"
          ref={canvasRef}
          onMouseMove={(e) => canvasRef.current && onMouseMoveCanvas(e, canvasRef.current.getBoundingClientRect())}
          className="absolute inset-0 w-[4000px] h-[4000px]"
        >
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
          onAdd={() => fileInputRef.current?.click()}
          onOrganize={organizeFiles}
          aiVisible={aiVisible}
          onToggleAi={() => setAiVisible((v: boolean) => !v)}
        />

        <ThoughtInputModal
          isOpen={isThoughtOpen}
          onClose={() => setIsThoughtOpen(false)}
          onSubmit={(thought) => addThoughtNode(thought)}
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.jpg,.jpeg,.mp3,.flac,.ppt,.pptx,.doc,.docx,.pdf,.mp4,.mov,.webm"
          multiple
          onChange={async (e) => {
            if (!e.target.files || e.target.files.length === 0) return;
            await uploadFiles(e.target.files);
            e.currentTarget.value = '';
          }}
        />

        <div className="absolute top-6 left-6 flex gap-2">
          <div className="bg-white border-2 border-textBlack px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_#111]">
            X: <span className="text-accentCoral">{String(coords.x).padStart(3, '0')}</span> Y: <span className="text-accentElectric">{String(coords.y).padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      <AIPanel visible={aiVisible} onClose={() => setAiVisible(false)} />
    </div>
  );
}

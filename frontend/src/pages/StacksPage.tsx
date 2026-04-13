import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import CreateStackModal from '../components/stacks/CreateStackModal.tsx';
import StackCard from '../components/stacks/StackCard.tsx';

type Stack = {
  id: string;
  name: string;
  fileCount: number;
  type: string;
};

type StacksPageProps = {
  stacks: Stack[];
  onCreateStack: (payload?: { name?: string; label?: string }) => void;
  onUpdateStack: (id: string, payload?: { name?: string; label?: string }) => void;
  onDeleteStack: (id: string) => void;
  onOpenStack: (id: string) => void;
};

export default function StacksPage({ stacks, onCreateStack, onUpdateStack, onDeleteStack, onOpenStack }: StacksPageProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStackId, setEditingStackId] = useState<string | null>(null);

  const editingStack = stacks.find((stack) => stack.id === editingStackId) ?? null;

  return (
    <div className="absolute inset-0 flex flex-col bg-bgCream">
      <div className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
        <header className="mb-12 border-b-2 border-textBlack pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-7xl md:text-9xl font-display uppercase tracking-wide leading-none">Archives</h1>
            <p className="font-medium mt-6 max-w-md text-sm border-l-2 border-textBlack pl-4">A repository for your scattered nodes. Organized by structural necessity.</p>
          </div>
          <div className="text-right border-2 border-textBlack bg-white px-6 py-4 shadow-[4px_4px_0px_#111]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Volumes</p>
            <p className="font-display text-4xl leading-none mt-2">{stacks.length}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
          {stacks.map((stack) => (
            <StackCard
              key={stack.id}
              stack={stack}
              onDelete={() => onDeleteStack(stack.id)}
              onOpen={() => onOpenStack(stack.id)}
              onEdit={() => setEditingStackId(stack.id)}
            />
          ))}
        </div>
      </div>

      <button onClick={() => setIsCreateOpen(true)} className="absolute bottom-12 right-12 w-16 h-16 bg-textBlack text-bgCream flex items-center justify-center hover:bg-accentElectric hover:text-textBlack border-2 border-textBlack transition-all duration-300 z-40 shadow-[8px_8px_0px_#111] hover:shadow-[4px_4px_0px_#111] hover:translate-y-1 hover:translate-x-1">
        <Plus size={24} weight="bold" />
      </button>

      <CreateStackModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Stack"
        submitLabel="Create Stack"
        onSubmit={(payload) => onCreateStack(payload)}
      />

      <CreateStackModal
        isOpen={Boolean(editingStack)}
        onClose={() => setEditingStackId(null)}
        title="Edit Stack"
        submitLabel="Save Changes"
        initialName={editingStack?.name || ''}
        initialLabel={editingStack?.type || ''}
        onSubmit={(payload) => {
          if (!editingStackId) return;
          onUpdateStack(editingStackId, payload);
        }}
      />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

type ThoughtInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (thought: string) => void;
};

export default function ThoughtInputModal({ isOpen, onClose, onSubmit }: ThoughtInputModalProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraft('');
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl border-2 border-textBlack bg-white shadow-[10px_10px_0px_#111] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-4xl uppercase leading-none">Type Thoughts</h3>
          <button onClick={onClose} className="w-8 h-8 border border-textBlack text-xs font-bold hover:bg-accentCoral">X</button>
        </div>

        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your thought..."
          className="w-full min-h-40 border-2 border-textBlack px-4 py-3 text-sm font-medium resize-y"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Enter creates a new line. Click Enter button to post.
          </p>
          <button
            onClick={() => {
              const normalized = draft.trim();
              if (!normalized) return;
              onSubmit(normalized);
              setDraft('');
              onClose();
            }}
            className="border-2 border-textBlack bg-textBlack text-bgCream px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentElectric hover:text-textBlack"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

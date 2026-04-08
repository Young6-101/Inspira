import { useEffect, useRef, useState } from 'react';

type URLInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
};

export default function URLInputModal({ isOpen, onClose, onSubmit }: URLInputModalProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraft('');
      return;
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl border-2 border-textBlack bg-white shadow-[10px_10px_0px_#111] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-4xl uppercase leading-none">Input URL</h3>
          <button onClick={onClose} className="w-8 h-8 border border-textBlack text-xs font-bold hover:bg-accentCoral">X</button>
        </div>

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://example.com"
          className="w-full border-2 border-textBlack px-4 py-3 text-sm font-medium"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const normalized = draft.trim();
            if (!normalized) return;
            onSubmit(normalized);
            setDraft('');
            onClose();
          }}
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Dedicated URL node input.
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
            Add URL Node
          </button>
        </div>
      </div>
    </div>
  );
}

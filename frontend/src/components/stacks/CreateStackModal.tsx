import { useEffect, useState } from 'react';

type CreateStackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  submitLabel?: string;
  initialName?: string;
  initialLabel?: string;
  onSubmit: (payload: { name?: string; label?: string }) => void;
};

export default function CreateStackModal({
  isOpen,
  onClose,
  title = 'New Stack',
  submitLabel = 'Create Stack',
  initialName = '',
  initialLabel = '',
  onSubmit
}: CreateStackModalProps) {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setLabel(initialLabel);
  }, [isOpen, initialName, initialLabel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg border-2 border-textBlack bg-white shadow-[10px_10px_0px_#111] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-5xl uppercase leading-none">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 border border-textBlack text-xs font-bold hover:bg-accentCoral">X</button>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, label });
            setName('');
            setLabel('');
            onClose();
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Stack Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Default: Untitled"
              className="border border-textBlack px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Default: Unsorted"
              className="border border-textBlack px-3 py-2 text-sm"
            />
          </div>

          <button className="mt-2 border border-textBlack bg-textBlack text-bgCream px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-accentElectric hover:text-textBlack">
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

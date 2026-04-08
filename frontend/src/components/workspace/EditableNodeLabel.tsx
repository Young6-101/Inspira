import { useEffect, useState } from 'react';

type EditableNodeLabelProps = {
  value?: string;
  fallback: string;
  onSave: (nextValue: string) => void;
  textClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

export default function EditableNodeLabel({
  value,
  fallback,
  onSave,
  textClassName = '',
  inputClassName = '',
  buttonClassName = ''
}: EditableNodeLabelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || fallback);

  useEffect(() => {
    setDraft(value || fallback);
  }, [value, fallback]);

  const commit = () => {
    const normalized = draft.trim() || fallback;
    onSave(normalized);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`text-left truncate max-w-[75%] border border-transparent hover:border-textBlack px-1 -mx-1 ${textClassName}`}
        title="Click to rename"
      >
        {value || fallback}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-[90%]" onMouseDown={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value || fallback);
            setEditing(false);
          }
        }}
        className={`min-w-0 flex-1 border-2 border-textBlack px-2 py-1 text-xs font-bold uppercase tracking-widest bg-white text-textBlack ${inputClassName}`}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          commit();
        }}
        className={`border-2 border-textBlack px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-textBlack text-bgCream hover:bg-accentElectric hover:text-textBlack ${buttonClassName}`}
      >
        Save
      </button>
    </div>
  );
}

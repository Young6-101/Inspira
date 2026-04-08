import { Image, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import EditableNodeLabel from './EditableNodeLabel.tsx';

type ImageNodeProps = {
  onDelete: () => void;
  label?: string;
  imageSrc?: string;
  onRename: (nextLabel: string) => void;
};

export default function ImageNode({ onDelete, label, imageSrc, onRename }: ImageNodeProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div className="w-64 p-3 flex flex-col gap-2" title={imageSrc ? 'Double-click to preview full image' : undefined}>
        <button onClick={onDelete} className="delete-btn absolute -top-3 -right-3 w-8 h-8 bg-textBlack text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-accentCoral border border-textBlack shadow-[2px_2px_0px_#111]">
          <X size={14} weight="bold" />
        </button>
        <div
          className="w-full h-48 bg-[#e5e5e0] border-2 border-textBlack flex items-center justify-center relative"
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (imageSrc) {
              setIsPreviewOpen(true);
            }
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={label || 'uploaded'}
              draggable={false}
              className="w-full h-full object-cover pointer-events-none select-none"
            />
          ) : (
            <Image size={40} className="text-gray-400" />
          )}
        </div>
        <div className="flex justify-between items-center px-1 pt-1">
          <EditableNodeLabel
            value={label}
            fallback="IMG_REF_01"
            onSave={onRename}
            textClassName="text-[10px] font-bold uppercase tracking-widest"
          />
          <Image size={16} className="text-accentElectric" weight="bold" />
        </div>
      </div>

      {isPreviewOpen && imageSrc
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
              onClick={() => setIsPreviewOpen(false)}
            >
              <img
                src={imageSrc}
                alt={label || 'uploaded-full'}
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </div>,
            document.body
          )
        : null}
    </>
  );
}

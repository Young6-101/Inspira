import type { RefObject } from 'react';

type WorkspaceFileUploadInputProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  onUpload: (files: FileList) => Promise<void>;
};

export default function WorkspaceFileUploadInput({ inputRef, onUpload }: WorkspaceFileUploadInputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      accept=".txt,.jpg,.jpeg,.mp3,.flac,.ppt,.pptx,.doc,.docx,.pdf,.mp4,.mov,.webm,.url"
      multiple
      onChange={async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        await onUpload(e.target.files);
        e.currentTarget.value = '';
      }}
    />
  );
}

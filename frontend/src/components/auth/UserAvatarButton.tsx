type UserAvatarButtonProps = {
  label: string;
  onClick: () => void;
};

export default function UserAvatarButton({ label, onClick }: UserAvatarButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 bg-textBlack text-bgCream flex items-center justify-center text-sm font-bold hover:bg-white hover:text-textBlack border border-textBlack transition-colors"
      aria-label="User account"
    >
      {label}
    </button>
  );
}

import { ButtonHTMLAttributes, ReactNode } from 'react';

type BrutalistButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children: ReactNode;
};

export default function BrutalistButton({ className = '', children, ...props }: BrutalistButtonProps) {
  return (
    <button className={`brutalist-button px-8 py-4 text-sm flex items-center gap-2 ${className}`} {...props}>
      {children}
    </button>
  );
}

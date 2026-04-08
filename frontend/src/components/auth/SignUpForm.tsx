import { useState } from 'react';
import type { SignUpPayload } from '../../types/auth';

type SignUpFormProps = {
  onSubmit: (payload: SignUpPayload) => void;
};

export default function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nickname.trim() || !email.trim() || !password.trim()) return;
        onSubmit({ nickname, email, password });
      }}
    >
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
        className="border border-textBlack px-3 py-2 text-sm"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border border-textBlack px-3 py-2 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="border border-textBlack px-3 py-2 text-sm"
      />
      <button className="border border-textBlack bg-textBlack text-bgCream px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentCoral hover:text-textBlack">
        Sign Up
      </button>
    </form>
  );
}

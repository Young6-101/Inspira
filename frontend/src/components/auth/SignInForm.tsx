import { useState } from 'react';
import type { AuthCredentials } from '../../types/auth';

type SignInFormProps = {
  onSubmit: (payload: AuthCredentials) => void;
};

export default function SignInForm({ onSubmit }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        onSubmit({ email, password });
      }}
    >
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
      <button className="border border-textBlack bg-textBlack text-bgCream px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-accentElectric hover:text-textBlack">
        Log In
      </button>
    </form>
  );
}

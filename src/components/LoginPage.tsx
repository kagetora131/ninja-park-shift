import { useState } from 'react';
import { LogIn, Swords } from 'lucide-react';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  error: string | null;
}

export function LoginPage({ onSignIn, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSignIn(email.trim(), password);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gold/30 bg-void-soft p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-void text-gold">
            <Swords size={22} />
          </div>
          <h1 className="font-mincho text-lg font-bold text-paper">忍者パークシフト</h1>
          <p className="text-[11px] tracking-widest text-paper-dim">ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-dim">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-paper-dim">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-paper/20 bg-void px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-seal-bright">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gold bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
          >
            <LogIn size={14} />
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

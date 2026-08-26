import { RotateCcw, Swords } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="border-b border-paper/10 bg-void-soft/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-void text-gold">
            <Swords size={20} />
          </div>
          <div>
            <h1 className="font-mincho text-lg font-bold tracking-wide text-paper sm:text-xl">
              忍者パークシフト
            </h1>
            <p className="text-[11px] tracking-widest text-paper-dim sm:text-xs">
              NINJA PARK SHIFT MANAGEMENT
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-full border border-paper/20 px-3 py-1.5 text-xs text-paper-dim transition hover:border-seal hover:text-seal-bright"
          title="編集内容を破棄してダミーデータに戻す"
        >
          <RotateCcw size={14} />
          初期状態に戻す
        </button>
      </div>
    </header>
  );
}

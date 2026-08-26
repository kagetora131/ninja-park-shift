import type { LucideIcon } from 'lucide-react';

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabNavProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function TabNav({ tabs, active, onChange }: TabNavProps) {
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pt-4 sm:px-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-seal-bright bg-void-soft text-paper'
                : 'border-transparent text-paper-dim hover:text-paper'
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

import { Icon } from '@iconify/react';
import { PICTOGRAMAS_DISPONIVEIS } from '../data/icons';

type IconSelectorProps = {
  value: string;
  showIcon: boolean;
  onToggleShowIcon: (value: boolean) => void;
  onSelectIcon: (icon: string) => void;
};

export function IconSelector({ value, showIcon, onToggleShowIcon, onSelectIcon }: IconSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-300">Incluir Pictograma</span>
        <input
          type="checkbox"
          checked={showIcon}
          onChange={(event) => onToggleShowIcon(event.target.checked)}
          className="w-4 h-4 accent-indigo-500 cursor-pointer"
        />
      </div>

      {showIcon && (
        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Pictograma
          </label>
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {Object.entries(PICTOGRAMAS_DISPONIVEIS).map(([categoria, itens]) => (
              <div key={categoria}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {categoria}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {itens.map((item) => {
                    const selected = value === item.slug;

                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => onSelectIcon(item.slug)}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${
                          selected
                            ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                            : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500'
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-800/80">
                          <Icon icon={item.slug} className="h-5 w-5" />
                        </span>
                        <span className="text-[10px] leading-tight uppercase tracking-wide">{item.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="icon-selector">
      <div className="icon-toggle">
        <span className="icon-toggle__label">Incluir Pictograma</span>
        <input
          type="checkbox"
          checked={showIcon}
          onChange={(event) => onToggleShowIcon(event.target.checked)}
        />
      </div>

      {showIcon && (
        <div>
          <label className="field-label">Pictograma</label>
          <div className="pictogram-list">
            {Object.entries(PICTOGRAMAS_DISPONIVEIS).map(([categoria, itens]) => (
              <div key={categoria} style={{ gridColumn: '1 / -1' }}>
                <p className="field-label" style={{ marginBottom: '0.55rem' }}>{categoria}</p>
                <div className="pictogram-list">
                  {itens.map((item) => {
                    const selected = value === item.slug;

                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => onSelectIcon(item.slug)}
                        className={`pictogram-item ${selected ? 'is-selected' : ''}`}
                      >
                        <span className="pictogram-item__icon">
                          <Icon icon={item.slug} className="h-5 w-5" />
                        </span>
                        <span className="pictogram-item__name">{item.nome}</span>
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

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { PICTOGRAMAS_DISPONIVEIS } from '../data/icons';

type IconSelectorProps = {
  value: string;
  showIcon: boolean;
  onToggleShowIcon: (value: boolean) => void;
  onSelectIcon: (icon: string) => void;
};

export function IconSelector({ value, showIcon, onToggleShowIcon, onSelectIcon }: IconSelectorProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const selectedItem = Object.values(PICTOGRAMAS_DISPONIVEIS)
    .flat()
    .find((item) => item.slug === value);

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
        <>
          <label className="field-label">Pictograma</label>
          <button type="button" className="pictogram-trigger" onClick={() => setOpen(true)}>
            <span className="pictogram-trigger__preview">
              <Icon icon={value || 'mdi:alert'} />
            </span>
            <span className="pictogram-trigger__text">
              <strong>{selectedItem?.nome ?? value ?? 'Selecionar pictograma'}</strong>
              <small>Escolher pictograma</small>
            </span>
            <span className="pictogram-trigger__chevron">⌄</span>
          </button>
        </>
      )}

      {open && (
        <div className="pictogram-modal" role="dialog" aria-modal="true" aria-label="Selecionar pictograma">
          <button type="button" className="pictogram-modal__backdrop" aria-label="Fechar" onClick={() => setOpen(false)} />
          <div className="pictogram-modal__panel">
            <div className="pictogram-modal__header">
              <div>
                <span className="eyebrow">Biblioteca</span>
                <h3>Selecionar pictograma</h3>
              </div>
              <button type="button" className="pictogram-modal__close" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </div>

            <div className="pictogram-modal__body">
              {Object.entries(PICTOGRAMAS_DISPONIVEIS).map(([categoria, itens]) => (
                <section key={categoria} className="pictogram-category">
                  <h4>{categoria}</h4>
                  <div className="pictogram-grid">
                    {itens.map((item) => {
                      const selected = value === item.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => {
                            onSelectIcon(item.slug);
                            setOpen(false);
                          }}
                          className={`pictogram-item ${selected ? 'is-selected' : ''}`}
                        >
                          <span className="pictogram-item__icon">
                            <Icon icon={item.slug} />
                          </span>
                          <span className="pictogram-item__name">{item.nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

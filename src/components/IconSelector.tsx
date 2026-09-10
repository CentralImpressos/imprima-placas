import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { PICTOGRAMAS_DISPONIVEIS } from '../data/icons';

type IconSelectorProps = {
  value: string;
  showIcon: boolean;
  onToggleShowIcon: (value: boolean) => void;
  onSelectIcon: (icon: string) => void;
};

function findSelectedIconName(slug: string): string | undefined {
  for (const itens of Object.values(PICTOGRAMAS_DISPONIVEIS)) {
    const found = itens.find((item) => item.slug === slug);
    if (found) {
      return found.nome;
    }
  }
  return undefined;
}

export function IconSelector({ value, showIcon, onToggleShowIcon, onSelectIcon }: IconSelectorProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const selectedName = findSelectedIconName(value);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => dialog.close();
    dialog.addEventListener('cancel', handleClose);
    return () => dialog.removeEventListener('cancel', handleClose);
  }, []);

  const openPicker = () => dialogRef.current?.showModal();

  const handleSelect = (slug: string) => {
    onSelectIcon(slug);
    dialogRef.current?.close();
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

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
          <button type="button" className="pictogram-trigger" onClick={openPicker}>
            <span className="pictogram-item__icon">
              {value && <Icon icon={value} className="h-5 w-5" />}
            </span>
            <span className="pictogram-trigger__name">{selectedName ?? 'Selecionar pictograma'}</span>
          </button>

          <dialog ref={dialogRef} className="pictogram-dialog" onClick={handleBackdropClick}>
            <div className="pictogram-dialog__panel">
              <div className="pictogram-dialog__header">
                <p className="field-label">Selecionar pictograma</p>
                <button
                  type="button"
                  className="pictogram-dialog__close"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div className="pictogram-dialog__body">
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
                            onClick={() => handleSelect(item.slug)}
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
          </dialog>
        </div>
      )}
    </div>
  );
}

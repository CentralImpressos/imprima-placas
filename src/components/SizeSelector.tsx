import { PLATE_SIZES } from '../data/sizes';

type SizeSelectorProps = {
  value: string;
  onChange: (sizeId: string) => void;
};

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div className="size-selector">
      <label className="field-label">Dimensão Comercial</label>
      <div className="size-grid">
        {PLATE_SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            onClick={() => onChange(size.id)}
            className={`size-card ${value === size.id ? 'is-selected' : ''}`}
          >
            <span className="size-card__label">{size.name}</span>
            <span className="size-card__meta">{size.shape ?? 'Retangular'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

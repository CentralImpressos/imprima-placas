import { PLATE_SIZES } from '../data/sizes';

type SizeSelectorProps = {
  value: string;
  onChange: (sizeId: string) => void;
};

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        Dimensão Comercial
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {PLATE_SIZES.map((size) => (
          <option key={size.id} value={size.id}>
            {size.name}
          </option>
        ))}
      </select>
    </div>
  );
}

import { buildIcon, loadIcon } from '@iconify/react';

export async function renderIcon(
  iconName: string,
  customisations: Record<string, string | number> = {},
): Promise<string> {
  const normalisedName = iconName.trim();

  if (!normalisedName) {
    return '';
  }

  try {
    const icon = await loadIcon(normalisedName);

    if (!icon) {
      return '';
    }

    const result = buildIcon(icon, {
      width: 128,
      height: 128,
      ...customisations,
    });

    return result.body || '';
  } catch (error) {
    console.error(`Não foi possível carregar o pictograma ${normalisedName}:`, error);
    return '';
  }
}

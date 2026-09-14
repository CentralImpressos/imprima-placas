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

    // The composition renderer positions icons using a 24x24 coordinate
    // system. Keeping the generated Iconify body in the same coordinate
    // system prevents the pictogram from becoming hundreds of percent larger
    // than the prohibition ring or the plate itself.
    const result = buildIcon(icon, {
      width: 24,
      height: 24,
      ...customisations,
    });

    return result.body || '';
  } catch (error) {
    console.error(`Não foi possível carregar o pictograma ${normalisedName}:`, error);
    return '';
  }
}

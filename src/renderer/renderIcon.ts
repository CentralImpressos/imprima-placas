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

    // viewBox 24x24 — o grupo pai define a cor via CSS `color` / currentColor.
    const result = buildIcon(icon, {
      width: 24,
      height: 24,
      ...customisations,
    });

    let body = result.body || '';
    // Garante que fills herdem a cor do grupo (color picker do pictograma).
    body = body
      .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
      .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');

    return body;
  } catch (error) {
    console.error(`Não foi possível carregar o pictograma ${normalisedName}:`, error);
    return '';
  }
}

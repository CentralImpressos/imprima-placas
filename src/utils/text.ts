export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function wrapText(value: string, maxChars = 22, maxLines = 3): string[] {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [];
  }

  const lines: string[] = [];
  const words = normalized.split(' ');
  let currentLine = '';

  for (const word of words) {
    if (!word) {
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxChars) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = '';
    }

    if (word.length > maxChars) {
      let fragment = word;

      while (fragment.length > maxChars && lines.length < maxLines - 1) {
        lines.push(fragment.slice(0, maxChars));
        fragment = fragment.slice(maxChars);
      }

      currentLine = fragment;
    } else {
      currentLine = word;
    }

    if (lines.length >= maxLines) {
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

export function normalizeLines(value: string, maxLines = 3, maxChars = 22): string[] {
  const chunks = value
    .replace(/\r/g, '')
    .split(/\n/)
    .flatMap((line) => wrapText(line, maxChars, maxLines))
    .filter(Boolean);

  return chunks.slice(0, maxLines);
}

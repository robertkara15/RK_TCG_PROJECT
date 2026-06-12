export type ParsedPtcglLine = {
  quantity: number;
  cardName: string;
  setCode?: string;
  cardNumber?: string;
  rawLine: string;
};

const SECTION_HEADER_REGEX = /^(Pokémon|Pokemon|Trainer|Energy):\s*\d+$/i;
const QUANTITY_LINE_REGEX = /^(\d+)\s+(.+)$/;

function normalizeCardNumber(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return String(parseInt(trimmed, 10));
  }
  return trimmed;
}

function parseQuantityLine(line: string): ParsedPtcglLine | null {
  const match = line.match(QUANTITY_LINE_REGEX);
  if (!match) {
    return null;
  }

  const quantity = Number.parseInt(match[1], 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  const remainder = match[2].trim();
  const setSuffixMatch = remainder.match(/^(.+?)\s+([A-Za-z0-9]{2,4})\s+(\S+)$/);
  if (setSuffixMatch) {
    return {
      quantity,
      cardName: setSuffixMatch[1].trim(),
      setCode: setSuffixMatch[2].toUpperCase(),
      cardNumber: normalizeCardNumber(setSuffixMatch[3]),
      rawLine: line,
    };
  }

  return {
    quantity,
    cardName: remainder,
    rawLine: line,
  };
}

export function parsePtcglDeckText(text: string): ParsedPtcglLine[] {
  const lines: ParsedPtcglLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue;
    }
    if (SECTION_HEADER_REGEX.test(line)) {
      continue;
    }

    const parsed = parseQuantityLine(line);
    if (parsed) {
      lines.push(parsed);
    }
  }

  return lines;
}

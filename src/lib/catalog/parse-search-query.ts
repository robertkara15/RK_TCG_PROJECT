export type ParsedCardSearch = {
  cardQuery: string;
  setId?: string;
};

type SetRef = {
  id: string;
  name: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match set names/ids only as whole tokens, not substrings inside card names. */
function findSetTokenIndex(query: string, token: string): number {
  const pattern = new RegExp(`(^|\\s)${escapeRegex(token)}(\\s|$)`, "i");
  const match = pattern.exec(query);
  if (!match) {
    return -1;
  }

  return match.index + (match[1] === " " ? 1 : 0);
}

function splitCardAndSet(
  query: string,
  token: string,
): { cardQuery: string; index: number } | null {
  const index = findSetTokenIndex(query, token);
  if (index === -1) {
    return null;
  }

  const cardQuery = `${query.slice(0, index)} ${query.slice(index + token.length)}`
    .trim()
    .replace(/\s+/g, " ");

  if (!cardQuery) {
    return null;
  }

  return { cardQuery, index };
}

/**
 * Split a free-text query like "slowking stellar crown" into card name + set
 * by matching the longest set name (or set id) found in the query string.
 */
export function parseCardSearchQuery(
  query: string,
  sets: SetRef[],
): ParsedCardSearch {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { cardQuery: "" };
  }

  const candidates = [...sets].sort((a, b) => b.name.length - a.name.length);

  for (const set of candidates) {
    const split = splitCardAndSet(trimmed, set.name.toLowerCase());
    if (split) {
      return { cardQuery: split.cardQuery, setId: set.id };
    }
  }

  const idCandidates = [...sets].sort((a, b) => b.id.length - a.id.length);
  for (const set of idCandidates) {
    const split = splitCardAndSet(trimmed, set.id.toLowerCase());
    if (split) {
      return { cardQuery: split.cardQuery, setId: set.id };
    }
  }

  return { cardQuery: trimmed };
}

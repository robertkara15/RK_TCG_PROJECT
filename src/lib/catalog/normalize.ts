export function normalizeCardName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractSetId(cardId: string, localId: string): string {
  return cardId.slice(0, cardId.length - localId.length - 1);
}

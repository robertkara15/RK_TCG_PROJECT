export function buildTcgdexImageUrl(
  serieId: string,
  setId: string,
  localId: string,
): string {
  return `https://assets.tcgdex.net/en/${serieId}/${setId}/${localId}`;
}

export function cardImageUrl(
  imageUrl: string | null | undefined,
  quality: "high" | "low" = "low",
): string | null {
  if (!imageUrl) {
    return null;
  }

  return `${imageUrl}/${quality}.webp`;
}

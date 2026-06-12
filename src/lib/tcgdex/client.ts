import type {
  TcgdexCardBrief,
  TcgdexCardDetail,
  TcgdexSetBrief,
  TcgdexSetDetail,
} from "./types";

const BASE_URL = "https://api.tcgdex.net/v2/en";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`TCGdex request failed (${response.status}): ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAllSets(): Promise<TcgdexSetBrief[]> {
  return fetchJson<TcgdexSetBrief[]>("/sets");
}

export async function fetchSetDetail(setId: string): Promise<TcgdexSetDetail | null> {
  const response = await fetch(`${BASE_URL}/sets/${encodeURIComponent(setId)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`TCGdex set request failed (${response.status}): ${setId}`);
  }

  return response.json() as Promise<TcgdexSetDetail>;
}

export async function fetchCardBriefsPage(
  page: number,
  itemsPerPage: number,
): Promise<TcgdexCardBrief[]> {
  return fetchJson<TcgdexCardBrief[]>(
    `/cards?pagination:page=${page}&pagination:itemsPerPage=${itemsPerPage}`,
  );
}

export async function fetchCardDetail(cardId: string): Promise<TcgdexCardDetail | null> {
  const response = await fetch(`${BASE_URL}/cards/${encodeURIComponent(cardId)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`TCGdex card request failed (${response.status}): ${cardId}`);
  }

  return response.json() as Promise<TcgdexCardDetail>;
}

export async function fetchCardBriefsTotal(): Promise<number> {
  const cards = await fetchJson<TcgdexCardBrief[]>("/cards");
  return cards.length;
}

import ayahsData from "./ayahs.json";

const data = ayahsData as Record<string, string>;

/**
 * Returns the QPC Hafs Unicode text for the given surah:ayah, or an empty
 * string if the key is missing. Async to keep room for swapping in a
 * network source later without rewriting call sites.
 */
export async function fetchAyahText(
  surah: number,
  ayah: number
): Promise<string> {
  return data[`${surah}:${ayah}`] ?? "";
}

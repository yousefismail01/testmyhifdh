import ayahsData from "./ayahs.json";

const data = ayahsData as Record<string, string>;

export function getAyahText(surah: number, ayah: number): string {
  return data[`${surah}:${ayah}`] ?? "";
}

export async function fetchAyahText(
  surah: number,
  ayah: number
): Promise<string> {
  return getAyahText(surah, ayah);
}

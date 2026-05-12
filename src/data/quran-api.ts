const API_BASE = "https://api.alquran.cloud/v1";

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
  };
}

interface ApiResponse {
  data: ApiAyah | ApiAyah[];
}

const cache = new Map<string, string>();

export async function fetchAyahText(
  surah: number,
  ayah: number
): Promise<string> {
  const key = `${surah}:${ayah}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(
    `${API_BASE}/ayah/${surah}:${ayah}/quran-uthmani`
  );
  const json: ApiResponse = await res.json();
  const data = json.data as ApiAyah;
  cache.set(key, data.text);
  return data.text;
}

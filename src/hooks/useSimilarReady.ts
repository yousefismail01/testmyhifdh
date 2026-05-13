import { useEffect, useState } from "react";
import {
  isSimilarReady,
  loadSimilar,
  subscribeSimilarReady,
} from "../data/similar-ayahs";

export function useSimilarReady(): boolean {
  const [ready, setReady] = useState<boolean>(isSimilarReady);
  useEffect(() => {
    if (isSimilarReady()) return;
    void loadSimilar();
    return subscribeSimilarReady(() => setReady(true));
  }, []);
  return ready;
}

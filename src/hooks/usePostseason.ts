'use client';

import { useState, useEffect } from 'react';
import { loadPostseasonData } from '@/src/lib/postseasonLoader';
import type { PostseasonData } from '@/src/types';

export function usePostseason(year: number) {
  const [data, setData] = useState<PostseasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadPostseasonData(year)
      .then(setData)
      .catch(() => setError('無法載入季後賽資料'))
      .finally(() => setLoading(false));
  }, [year]);

  return { data, loading, error };
}

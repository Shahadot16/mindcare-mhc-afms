import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errMsg } from '@/api/client';

/** GET a URL and keep {data, loading, error}; call reload() to refresh. Pass null to skip. */
export default function useFetch(url, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');
  const reqId = useRef(0);

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!url) return;
    const id = ++reqId.current;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(url);
      if (id === reqId.current) { setData(res.data); setError(''); }
    } catch (e) {
      if (id === reqId.current) setError(errMsg(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => { reload(); }, [reload]);

  return { data, setData, loading, error, reload };
}

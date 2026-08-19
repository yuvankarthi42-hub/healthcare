import { useCallback, useEffect, useRef, useState } from "react";
import api from "./apiClient";

/** Fetches `url` with `params`; re-fetches when the JSON-stringified params change. */
export function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params || {});
  const mounted = useRef(true);

  const load = useCallback(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(url, { params })
      .then((res) => mounted.current && setData(res.data))
      .catch((err) => mounted.current && setError(err.response?.data?.error || err.message))
      .finally(() => mounted.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { data, loading, error, refetch: load };
}

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook sederhana untuk fetch data dengan penanganan state loading & error.
 * @param {Function} fetchFunction - Fungsi async yang mereturn response API.
 * @returns {{ data: any, loading: boolean, error: any, refetch: Function }}
 */
export function useFetch(fetchFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction();
      const result = response?.data?.data !== undefined ? response.data.data : (response?.data || response);
      setData(result);
    } catch (err) {
      console.error("Error pada useFetch:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, setData, loading, error, refetch: fetchData };
}

export default useFetch;

import { useEffect, useState } from 'react';
import type { ScenarioSummary } from '../types/scenario';
import { API_URLS, fetchApi } from '../services/api';

export function useScenarios() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScenarios = async () => {
    try {
      const data = await fetchApi<ScenarioSummary[]>(API_URLS.scenarios);
      setScenarios(data);
    } catch {
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  return { scenarios, loading, reload: loadScenarios };
}

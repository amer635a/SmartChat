const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/api';

export const API_URLS = {
  health: `${API_BASE}/health`,
  scenarios: `${API_BASE}/scenarios`,
  scenarioCreate: `${API_BASE}/scenarios/create`,
  scenarioDetail: (id: string) => `${API_BASE}/scenarios/${id}`,
  scenarioDelete: (id: string) => `${API_BASE}/scenarios/${id}`,
  scenarioScripts: `${API_BASE}/scenarios/scripts`,
  scenarioReload: `${API_BASE}/scenarios/reload`,
  trainingTrain: `${API_BASE}/training/train`,
  trainingStatus: `${API_BASE}/training/status`,
  chatWs: (sessionId: string) => `${WS_BASE}/chat/${sessionId}`,
};

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      detail = json.detail ?? JSON.stringify(json);
    } catch { /* ignore parse errors */ }
    throw new Error(detail);
  }
  return response.json();
}

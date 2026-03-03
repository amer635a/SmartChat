import { useState, useEffect, useCallback } from 'react';
import { ScenarioList } from './ScenarioList';
import { FlowEditor } from './FlowEditor';
import { API_URLS, fetchApi } from '../../services/api';
import type { Scenario, ScenarioSummary, ScriptInfo } from '../../types/scenario';
import './ScenarioBuilder.css';

function createEmptyScenario(): Scenario {
  return {
    id: '',
    name: '',
    description: '',
    training_phrases: [''],
    steps: [{ action: 'run_script' }],
  };
}

export function ScenarioBuilder() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario>(createEmptyScenario());
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  const loadList = useCallback(async () => {
    try {
      const data = await fetchApi<ScenarioSummary[]>(API_URLS.scenarios);
      setScenarios(data);
    } catch {
      setScenarios([]);
    }
  }, []);

  useEffect(() => {
    loadList();
    fetchApi<ScriptInfo[]>(API_URLS.scenarioScripts).then(setScripts).catch(() => setScripts([]));
  }, [loadList]);

  const handleSelectScenario = async (id: string) => {
    try {
      const full = await fetchApi<Scenario>(API_URLS.scenarioDetail(id));
      setActiveScenario(full);
      setIsNew(false);
      setSaveResult(null);
    } catch {
      // ignore
    }
  };

  const handleNew = () => {
    setActiveScenario(createEmptyScenario());
    setIsNew(true);
    setSaveResult(null);
  };

  function slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  const handleSave = async (scenario: Scenario, andTrain: boolean) => {
    if (!scenario.name.trim()) {
      setSaveResult({ ok: false, message: 'Name is required' });
      return;
    }

    const nonEmptyPhrases = scenario.training_phrases.filter(p => p.trim());
    if (nonEmptyPhrases.length === 0) {
      setSaveResult({ ok: false, message: 'At least one training phrase is required' });
      return;
    }

    const id = isNew ? slugify(scenario.name) : scenario.id;
    const toSave = { ...scenario, id, training_phrases: nonEmptyPhrases };

    setSaving(true);
    setSaveResult(null);
    try {
      await fetchApi(API_URLS.scenarioCreate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });

      if (andTrain) {
        await fetchApi(API_URLS.trainingTrain, { method: 'POST' });
      }

      await loadList();
      setIsNew(false);
      setSaveResult({ ok: true, message: andTrain ? 'Saved & training complete' : 'Saved successfully' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setSaveResult({ ok: false, message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetchApi(API_URLS.scenarioDelete(id), { method: 'DELETE' });
      await loadList();
      handleNew();
    } catch {
      setSaveResult({ ok: false, message: 'Delete failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <aside className="builder-sidebar">
        <ScenarioList
          scenarios={scenarios}
          activeId={activeScenario.id}
          onSelect={handleSelectScenario}
          onNew={handleNew}
        />
      </aside>
      <main className="builder-main">
        <FlowEditor
          scenario={activeScenario}
          onChange={setActiveScenario}
          scripts={scripts}
          isNew={isNew}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={saving}
          saveResult={saveResult}
        />
      </main>
    </>
  );
}

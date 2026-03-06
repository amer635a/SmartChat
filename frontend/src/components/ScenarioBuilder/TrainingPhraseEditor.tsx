import { useRef } from 'react';

// When more than this many phrases, switch to bulk/summary view
const BULK_THRESHOLD = 20;

interface Props {
  phrases: string[];
  onChange: (phrases: string[]) => void;
}

export function TrainingPhraseEditor({ phrases, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBulk = phrases.length > BULK_THRESHOLD;
  const nonEmpty = phrases.filter(p => p.trim());

  const updatePhrase = (index: number, value: string) => {
    const updated = [...phrases];
    updated[index] = value;
    onChange(updated);
  };

  const removePhrase = (index: number) => {
    if (phrases.length <= 1) return;
    onChange(phrases.filter((_, i) => i !== index));
  };

  const addPhrase = () => {
    onChange([...phrases, '']);
  };

  const clearAll = () => {
    onChange(['']);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        let loaded: string[] = [];

        if (Array.isArray(data)) {
          loaded = data.filter(item => typeof item === 'string' && item.trim());
        } else if (typeof data === 'object' && data !== null) {
          const key = ['phrases', 'training_phrases'].find(k => Array.isArray((data as Record<string, unknown>)[k]));
          if (key) {
            loaded = (data as Record<string, unknown[]>)[key].filter(
              (item: unknown) => typeof item === 'string' && (item as string).trim()
            ) as string[];
          } else {
            const firstArr = Object.values(data).find(v => Array.isArray(v)) as string[] | undefined;
            if (firstArr) loaded = firstArr.filter(item => typeof item === 'string' && item.trim());
          }
        }

        if (loaded.length === 0) {
          alert('No phrases found in the JSON file. Expected an array of strings.');
          return;
        }

        onChange(loaded);
      } catch {
        alert('Invalid JSON file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="form-section">
      <h3 className="section-title">Training Phrases</h3>
      <div className="phrases-toolbar">
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
          {nonEmpty.length.toLocaleString()} phrase{nonEmpty.length !== 1 ? 's' : ''} loaded
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="btn-upload-json" onClick={() => fileInputRef.current?.click()}>
            &#x1F4C2; Upload JSON
          </button>
          {isBulk && (
            <button className="btn-upload-json" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={clearAll}>
              &#x2715; Clear
            </button>
          )}
        </div>
      </div>

      {isBulk ? (
        // Bulk summary view — no individual inputs, no lag
        <div className="phrases-bulk-view">
          <div className="phrases-bulk-badge">
            <span className="bulk-count">{nonEmpty.length.toLocaleString()}</span>
            <span className="bulk-label">training phrases loaded</span>
          </div>
          <div className="phrases-preview-label">Preview:</div>
          <div className="phrases-preview-list">
            {nonEmpty.slice(0, 3).map((p, i) => (
              <div key={i} className="phrases-preview-item">{p}</div>
            ))}
            {nonEmpty.length > 3 && (
              <div className="phrases-preview-more">
                + {(nonEmpty.length - 3).toLocaleString()} more
              </div>
            )}
          </div>
        </div>
      ) : (
        // Manual edit view — shown when few phrases
        <>
          <div className="phrases-hint">
            JSON format: <code>["phrase one", "phrase two", ...]</code>
          </div>
          {phrases.map((phrase, i) => (
            <div key={i} className="phrase-row">
              <input
                type="text"
                className="builder-input"
                value={phrase}
                onChange={e => updatePhrase(i, e.target.value)}
                placeholder="e.g., how do I check the export limit"
              />
              <button
                className="btn-remove"
                onClick={() => removePhrase(i)}
                disabled={phrases.length <= 1}
              >
                x
              </button>
            </div>
          ))}
          <button className="btn-add" onClick={addPhrase}>+ Add Phrase</button>
        </>
      )}
    </div>
  );
}

import type { ScenarioSummary } from '../../types/scenario';

interface Props {
  scenarios: ScenarioSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ScenarioList({ scenarios, activeId, onSelect, onNew }: Props) {
  return (
    <div className="builder-scenario-list">
      <div className="builder-list-header">
        <h3>Scenarios</h3>
        <button className="btn-new-scenario" onClick={onNew}>+ New</button>
      </div>
      <div className="builder-list-items">
        {scenarios.map(s => (
          <div
            key={s.id}
            className={`builder-list-item ${s.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="list-item-name">{s.name}</span>
            <span className="list-item-id">{s.id}</span>
          </div>
        ))}
        {scenarios.length === 0 && (
          <p style={{ color: '#4a4a6a', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
            No scenarios yet
          </p>
        )}
      </div>
    </div>
  );
}

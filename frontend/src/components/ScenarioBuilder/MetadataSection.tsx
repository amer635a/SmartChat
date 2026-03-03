import type { Scenario } from '../../types/scenario';

interface Props {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
}

export function MetadataSection({ scenario, onChange }: Props) {
  return (
    <div className="form-section">
      <h3 className="section-title">Scenario Details</h3>
      <div className="field-row">
        <label className="field-label">Name</label>
        <input
          type="text"
          className="builder-input"
          value={scenario.name}
          onChange={e => onChange({ ...scenario, name: e.target.value })}
          placeholder="e.g., Export Limit"
        />
      </div>
      <div className="field-row">
        <label className="field-label">Description</label>
        <textarea
          className="builder-textarea"
          value={scenario.description}
          onChange={e => onChange({ ...scenario, description: e.target.value })}
          placeholder="Describe what this scenario does..."
        />
      </div>
    </div>
  );
}

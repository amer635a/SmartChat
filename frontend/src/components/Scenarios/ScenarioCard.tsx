import type { ScenarioSummary } from '../../types/scenario';
import './Scenarios.css';

interface Props {
  scenario: ScenarioSummary;
}

export function ScenarioCard({ scenario }: Props) {
  return (
    <div className="scenario-card">
      <h4>{scenario.name}</h4>
      <p>{scenario.description}</p>
    </div>
  );
}

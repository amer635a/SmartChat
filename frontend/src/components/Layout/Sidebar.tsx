import { useScenarios } from '../../hooks/useScenarios';
import { ScenarioCard } from '../Scenarios/ScenarioCard';
import './Layout.css';

export function Sidebar() {
  const { scenarios, loading } = useScenarios();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Available Scenarios</h3>
      </div>
      <div className="sidebar-content">
        {loading ? (
          <p className="sidebar-loading">Loading...</p>
        ) : scenarios.length === 0 ? (
          <p className="sidebar-empty">No scenarios loaded</p>
        ) : (
          scenarios.map((s) => <ScenarioCard key={s.id} scenario={s} />)
        )}
      </div>
    </aside>
  );
}

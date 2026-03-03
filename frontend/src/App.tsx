import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { MainLayout } from './components/Layout/MainLayout';
import { ScenarioBuilder } from './components/ScenarioBuilder/ScenarioBuilder';
import type { Page } from './components/Layout/Header';

function App() {
  const [page, setPage] = useState<Page>('chat');

  return (
    <div className="app-layout">
      <Header activePage={page} onPageChange={setPage} />
      <div className="app-body">
        {page === 'chat' ? <MainLayout /> : <ScenarioBuilder />}
      </div>
    </div>
  );
}

export default App;

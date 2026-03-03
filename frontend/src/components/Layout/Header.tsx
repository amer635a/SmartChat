import './Layout.css';

export type Page = 'chat' | 'builder';

interface Props {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

export function Header({ activePage, onPageChange }: Props) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-icon">&#x1F4AC;</span>
        <h1>Smart<span className="brand-accent">Chat</span></h1>
      </div>
      <p className="header-subtitle">Scenario-Driven Support Agent</p>
      <nav className="header-nav">
        <button
          className={`nav-tab ${activePage === 'chat' ? 'nav-tab-active' : ''}`}
          onClick={() => onPageChange('chat')}
        >
          Chat
        </button>
        <button
          className={`nav-tab ${activePage === 'builder' ? 'nav-tab-active' : ''}`}
          onClick={() => onPageChange('builder')}
        >
          Scenario Builder
        </button>
      </nav>
    </header>
  );
}

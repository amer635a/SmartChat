import { ChatContainer } from '../Chat/ChatContainer';
import './Layout.css';

export function MainLayout() {
  return (
    <main className="main-content" style={{ marginLeft: 0 }}>
      <ChatContainer />
    </main>
  );
}

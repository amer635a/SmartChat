import { Sidebar } from './Sidebar';
import { ChatContainer } from '../Chat/ChatContainer';
import './Layout.css';

export function MainLayout() {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        <ChatContainer />
      </main>
    </>
  );
}

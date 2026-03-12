import { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useChatSession } from '../../hooks/useChatSession';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import './Chat.css';

interface Props {
  sessionId?: string;
}

export function ChatContainer({ sessionId: propSessionId }: Props) {
  const sessionId = useMemo(() => propSessionId || uuidv4(), [propSessionId]);
  const { sendMessage, messageQueue, isConnected, resetQueue } = useWebSocket(sessionId);
  const { messages, isTyping, addUserMessage, clearMessages } = useChatSession(messageQueue);

  const handleSendText = useCallback((text: string) => {
    addUserMessage(text);
    sendMessage({ type: 'user_message', content: text });
  }, [addUserMessage, sendMessage]);

  const handleChoiceSelect = useCallback((value: string) => {
    addUserMessage(value);
    sendMessage({ type: 'choice_response', value });
  }, [addUserMessage, sendMessage]);

  const handleClear = useCallback(() => {
    clearMessages(() => {
      resetQueue();
      sendMessage({ type: 'reset' } as any);
    });
  }, [clearMessages, resetQueue, sendMessage]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="chat-title">SmartChat</span>
        </div>
        <div className="chat-header-right">
          <span className="connection-status">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
          {messages.length > 0 && (
            <button className="clear-chat-btn" onClick={handleClear} title="Clear chat">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      <MessageList
        messages={messages}
        isTyping={isTyping}
        onChoiceSelect={handleChoiceSelect}
      />
      <ChatInput
        onSend={handleSendText}
        disabled={!isConnected}
        placeholder={isConnected ? 'Type your message...' : 'Connecting...'}
      />
    </div>
  );
}

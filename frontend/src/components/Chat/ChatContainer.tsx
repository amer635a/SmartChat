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
  const { sendMessage, messageQueue, isConnected } = useWebSocket(sessionId);
  const { messages, isTyping, addUserMessage } = useChatSession(messageQueue);

  const handleSendText = useCallback((text: string) => {
    addUserMessage(text);
    sendMessage({ type: 'user_message', content: text });
  }, [addUserMessage, sendMessage]);

  const handleChoiceSelect = useCallback((value: string) => {
    addUserMessage(value);
    sendMessage({ type: 'choice_response', value });
  }, [addUserMessage, sendMessage]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="chat-title">SmartChat</span>
        </div>
        <span className="connection-status">
          {isConnected ? 'Connected' : 'Reconnecting...'}
        </span>
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

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import './Chat.css';

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  onChoiceSelect: (value: string) => void;
}

export function MessageList({ messages, isTyping, onChoiceSelect }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onChoiceSelect={onChoiceSelect}
          isLatest={index === messages.length - 1}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}

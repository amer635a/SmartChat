import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../types/chat';
import type { WSServerMessage } from '../types/websocket';

const STORAGE_KEY = 'smartchat_messages';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: ChatMessage) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* quota exceeded — ignore */ }
}

export function useChatSession(messageQueue: WSServerMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isTyping, setIsTyping] = useState(false);
  const processedCount = useRef(0);

  useEffect(() => {
    const newMessages = messageQueue.slice(processedCount.current);
    if (newMessages.length === 0) return;
    processedCount.current = messageQueue.length;

    const chatMessages: ChatMessage[] = [];
    let typingState: boolean | null = null;

    for (const msg of newMessages) {
      if (msg.type === 'typing') {
        typingState = msg.content === 'true';
        continue;
      }
      chatMessages.push({
        id: uuidv4(),
        type: msg.type === 'text' ? 'system' : msg.type as ChatMessage['type'],
        content: msg.content,
        options: msg.options,
        inputKey: msg.input_key,
        displayMessage: msg.display_message,
        timestamp: new Date(),
      });
    }

    if (chatMessages.length > 0) {
      setMessages(prev => [...prev, ...chatMessages]);
      setIsTyping(false);
    } else if (typingState !== null) {
      setIsTyping(typingState);
    }
  }, [messageQueue]);

  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const clearMessages = useCallback((onClear?: () => void) => {
    setMessages([]);
    processedCount.current = 0;
    localStorage.removeItem(STORAGE_KEY);
    onClear?.();
  }, []);

  return { messages, isTyping, addUserMessage, clearMessages };
}

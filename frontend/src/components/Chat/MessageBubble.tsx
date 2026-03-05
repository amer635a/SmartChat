import type { ChatMessage } from '../../types/chat';
import { ScriptResultCard } from './ScriptResultCard';
import { QuickReplyButtons } from './QuickReplyButtons';
import './Chat.css';

interface Props {
  message: ChatMessage;
  onChoiceSelect?: (value: string) => void;
  isLatest: boolean;
}

export function MessageBubble({ message, onChoiceSelect, isLatest }: Props) {
  if (message.type === 'user') {
    return (
      <div className="message-row user-row">
        <div className="message-bubble user-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.type === 'script_result') {
    return (
      <div className="message-row system-row">
        <ScriptResultCard
          content={message.content}
          displayMessage={message.displayMessage}
        />
      </div>
    );
  }

  if (message.type === 'question' && message.options) {
    return (
      <div className="message-row system-row">
        <div className="message-bubble system-bubble">{message.content}</div>
        {isLatest && onChoiceSelect && (
          <QuickReplyButtons
            options={message.options}
            onSelect={onChoiceSelect}
          />
        )}
      </div>
    );
  }

  if (message.type === 'input_request') {
    return (
      <div className="message-row system-row">
        <div className="message-bubble system-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.type === 'scenario_start') {
    return (
      <div className="message-row system-row">
        <div className="message-bubble scenario-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.type === 'scenario_end') {
    return (
      <div className="message-row system-row">
        <div className="message-bubble scenario-end-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.type === 'ai_response') {
    return (
      <div className="message-row system-row">
        <div className="message-bubble ai-bubble">{message.content}</div>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="message-row system-row">
        <div className="message-bubble error-bubble">{message.content}</div>
      </div>
    );
  }

  // Default system message
  return (
    <div className="message-row system-row">
      <div className="message-bubble system-bubble">{message.content}</div>
    </div>
  );
}

import { useState } from 'react';
import type { ChoiceOption } from '../../types/chat';
import './Chat.css';

interface Props {
  options: ChoiceOption[];
  onSelect: (value: string) => void;
}

export function QuickReplyButtons({ options, onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (value: string) => {
    if (selected) return; // Prevent double-click
    setSelected(value);
    onSelect(value);
  };

  return (
    <div className="quick-reply-buttons">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`quick-reply-btn ${selected === opt.value ? 'selected' : ''} ${selected && selected !== opt.value ? 'disabled' : ''}`}
          onClick={() => handleClick(opt.value)}
          disabled={!!selected}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'system' | 'script_result' | 'question' | 'input_request' | 'error' | 'scenario_start' | 'scenario_end' | 'ai_response';
  content: string;
  options?: ChoiceOption[];
  inputKey?: string;
  displayMessage?: string;
  timestamp: Date;
}

export interface ChoiceOption {
  label: string;
  value: string;
}

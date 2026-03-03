export interface WSClientMessage {
  type: 'user_message' | 'choice_response' | 'input_response';
  content?: string;
  value?: string;
  input_key?: string;
}

export interface WSServerMessage {
  type: 'text' | 'script_result' | 'question' | 'input_request' | 'error' | 'typing' | 'scenario_start' | 'scenario_end';
  content: string;
  display_message?: string;
  options?: { label: string; value: string }[];
  input_key?: string;
}

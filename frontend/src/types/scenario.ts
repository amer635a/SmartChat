export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
}

export interface ChoiceOption {
  label: string;
  value: string;
}

export type StepAction = 'run_script' | 'ask_choice' | 'ask_input' | 'end';

export interface Step {
  action: StepAction;
  script?: string;
  args?: Record<string, string>;
  display_message?: string;
  question?: string;
  options?: ChoiceOption[];
  branches?: Record<string, Step[]>;
  input_key?: string;
  validation?: string;
  message?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  training_phrases: string[];
  steps: Step[];
}

export interface ScriptInfo {
  name: string;
}

import type { Node, Edge } from '@xyflow/react';

export interface FlowNodeData extends Record<string, unknown> {
  nodeType: 'start' | 'run_script' | 'run_script_branch' | 'ask_choice' | 'ask_input' | 'end' | 'goto' | 'call_scenario';
  // label — used as a goto target identifier
  label?: string;
  // run_script fields
  script?: string;
  command?: string;
  args?: Record<string, string>;
  display_message?: string;
  // run_script_branch fields
  branch_field?: string;
  // ask_choice fields
  question?: string;
  options?: { label: string; value: string }[];
  // ask_input fields
  input_key?: string;
  validation?: string;
  // end fields
  message?: string;
  // goto fields
  target?: string;
  // call_scenario fields
  target_scenario?: string;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

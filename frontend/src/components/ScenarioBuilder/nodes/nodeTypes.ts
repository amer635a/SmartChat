// IMPORTANT: Must be defined at module scope — NOT inside a component.
// Defining inside a component causes React Flow to remount all nodes on every render.
import { StartNode } from './StartNode';
import { RunScriptNode } from './RunScriptNode';
import { AskChoiceNode } from './AskChoiceNode';
import { AskInputNode } from './AskInputNode';
import { EndNode } from './EndNode';
import { GotoNode } from './GotoNode';
import { CallScenarioNode } from './CallScenarioNode';

export const nodeTypes = {
  start: StartNode,
  run_script: RunScriptNode,
  ask_choice: AskChoiceNode,
  ask_input: AskInputNode,
  end: EndNode,
  goto: GotoNode,
  call_scenario: CallScenarioNode,
} as const;

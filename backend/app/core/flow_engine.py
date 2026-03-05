from app.core.scenario_registry import ScenarioRegistry
from app.core.script_executor import ScriptExecutor
from app.nlp.intent_classifier import IntentClassifier
from app.nlp.llm_fallback import LLMFallback
from app.models.session import ChatSession, SessionState
from app.models.messages import ResponseMessage
from app.models.scenario import Step


class FlowEngine:
    def __init__(self, registry: ScenarioRegistry, executor: ScriptExecutor,
                 llm_fallback: LLMFallback | None = None):
        self.registry = registry
        self.executor = executor
        self.llm_fallback = llm_fallback

    async def handle_message(
        self, session: ChatSession, user_text: str, classifier: IntentClassifier
    ) -> list[ResponseMessage]:
        responses = []

        if session.state == SessionState.IDLE:
            # Classify intent
            if not classifier.is_loaded():
                return [ResponseMessage(
                    type="error",
                    content="The system model is not trained yet. Please train the model first."
                )]

            intent_id, confidence = classifier.predict(user_text)
            scenario = self.registry.get(intent_id) if intent_id else None

            if scenario is None:
                # Try LLM fallback for unknown queries
                if self.llm_fallback:
                    try:
                        llm_response = await self.llm_fallback.generate_response(user_text)
                        if llm_response:
                            return [ResponseMessage(type="ai_response", content=llm_response)]
                    except Exception:
                        pass
                return [ResponseMessage(
                    type="error",
                    content="I didn't understand that. Could you rephrase your question?"
                )]

            # Start scenario
            session.active_scenario_id = intent_id
            session.current_step_index = 0
            session.current_branch_key = None
            session.current_branch_step_index = 0
            session.collected_inputs.clear()

            responses.append(ResponseMessage(
                type="scenario_start",
                content=f"Starting scenario: {scenario.name}"
            ))

            # Execute first step
            step_responses = await self._execute_current_step(session)
            responses.extend(step_responses)

        elif session.state == SessionState.AWAITING_CHOICE:
            responses.extend(await self._handle_choice(session, user_text))

        elif session.state == SessionState.AWAITING_INPUT:
            responses.extend(await self._handle_input(session, user_text))

        return responses

    async def _execute_current_step(self, session: ChatSession) -> list[ResponseMessage]:
        scenario = self.registry.get(session.active_scenario_id)
        if not scenario:
            session.reset()
            return [ResponseMessage(type="error", content="Scenario not found.")]

        # Determine which step list we're in (main or branch)
        if session.current_branch_key is not None:
            # We're in a branch
            parent_step = scenario.steps[session.current_step_index]
            if parent_step.branches and session.current_branch_key in parent_step.branches:
                steps = parent_step.branches[session.current_branch_key]
                step_index = session.current_branch_step_index
            else:
                session.reset()
                return [ResponseMessage(type="error", content="Branch not found.")]
        else:
            steps = scenario.steps
            step_index = session.current_step_index

        if step_index >= len(steps):
            return self._end_scenario(session)

        step = steps[step_index]
        return await self._process_step(session, step)

    async def _process_step(self, session: ChatSession, step: Step) -> list[ResponseMessage]:
        responses = []

        if step.action == "run_script":
            session.state = SessionState.EXECUTING
            resolved_args = self._resolve_args(step.args, session)
            result = await self.executor.run(step.script, args=resolved_args)

            responses.append(ResponseMessage(
                type="script_result",
                content=result,
                display_message=step.display_message or "Result:"
            ))
            session.state = SessionState.IDLE

            # Advance to next step
            self._advance_step(session)
            next_responses = await self._execute_current_step(session)
            responses.extend(next_responses)

        elif step.action == "ask_choice":
            options = [{"label": o.label, "value": o.value} for o in (step.options or [])]
            responses.append(ResponseMessage(
                type="question",
                content=step.question or "Please choose:",
                options=options
            ))
            session.state = SessionState.AWAITING_CHOICE

        elif step.action == "ask_input":
            responses.append(ResponseMessage(
                type="input_request",
                content=step.question or "Please provide input:",
                input_key=step.input_key
            ))
            session.state = SessionState.AWAITING_INPUT

        elif step.action == "goto":
            # Jump to a labeled step in the main steps list
            scenario = self.registry.get(session.active_scenario_id)
            if scenario and step.target:
                for idx, s in enumerate(scenario.steps):
                    if s.label == step.target:
                        session.current_step_index = idx
                        session.current_branch_key = None
                        session.current_branch_step_index = 0
                        session.state = SessionState.IDLE
                        return await self._execute_current_step(session)
            # Target not found — end scenario
            session.reset()
            return [ResponseMessage(type="error", content=f"Goto target '{step.target}' not found.")]

        elif step.action == "end":
            msg = step.message or "Scenario complete. How can I help you next?"
            responses.append(ResponseMessage(type="scenario_end", content=msg))
            session.reset()

        return responses

    async def _handle_choice(self, session: ChatSession, user_text: str) -> list[ResponseMessage]:
        scenario = self.registry.get(session.active_scenario_id)
        if not scenario:
            session.reset()
            return [ResponseMessage(type="error", content="Scenario not found.")]

        # Find the current ask_choice step
        if session.current_branch_key is not None:
            parent_step = scenario.steps[session.current_step_index]
            steps = parent_step.branches[session.current_branch_key]
            step = steps[session.current_branch_step_index]
        else:
            step = scenario.steps[session.current_step_index]

        if step.action != "ask_choice" or not step.branches:
            session.reset()
            return [ResponseMessage(type="error", content="Unexpected state.")]

        # Match user input to an option value
        choice_value = user_text.strip().lower()
        matched_branch = None
        for option in (step.options or []):
            if choice_value == option.value.lower() or choice_value == option.label.lower():
                matched_branch = option.value
                break

        if matched_branch is None:
            # Try fuzzy: check if any branch key matches
            for key in step.branches:
                if choice_value == key.lower():
                    matched_branch = key
                    break

        if matched_branch is None or matched_branch not in step.branches:
            return [ResponseMessage(
                type="error",
                content="Please select one of the available options."
            )]

        # Enter the branch
        if session.current_branch_key is None:
            # Entering branch from main steps
            session.current_branch_key = matched_branch
            session.current_branch_step_index = 0
        else:
            # Already in a branch - for simplicity, handle the sub-branch inline
            session.current_branch_key = matched_branch
            session.current_branch_step_index = 0

        session.state = SessionState.IDLE
        return await self._execute_current_step(session)

    async def _handle_input(self, session: ChatSession, user_text: str) -> list[ResponseMessage]:
        scenario = self.registry.get(session.active_scenario_id)
        if not scenario:
            session.reset()
            return [ResponseMessage(type="error", content="Scenario not found.")]

        # Find the current ask_input step
        if session.current_branch_key is not None:
            parent_step = scenario.steps[session.current_step_index]
            steps = parent_step.branches[session.current_branch_key]
            step = steps[session.current_branch_step_index]
        else:
            step = scenario.steps[session.current_step_index]

        if step.action != "ask_input":
            session.reset()
            return [ResponseMessage(type="error", content="Unexpected state.")]

        # Store the input
        input_key = step.input_key or "input"
        session.collected_inputs[input_key] = user_text.strip()

        # Advance to next step
        session.state = SessionState.IDLE
        self._advance_step(session)
        return await self._execute_current_step(session)

    def _advance_step(self, session: ChatSession):
        if session.current_branch_key is not None:
            session.current_branch_step_index += 1
        else:
            session.current_step_index += 1

    def _end_scenario(self, session: ChatSession) -> list[ResponseMessage]:
        session.reset()
        return [ResponseMessage(
            type="scenario_end",
            content="Scenario complete. How can I help you next?"
        )]

    def _resolve_args(self, args: dict[str, str] | None, session: ChatSession) -> dict[str, str] | None:
        if not args:
            return None
        resolved = {}
        for key, value in args.items():
            if isinstance(value, str) and value.startswith("$input."):
                input_key = value[len("$input."):]
                resolved[key] = session.collected_inputs.get(input_key, "")
            else:
                resolved[key] = value
        return resolved

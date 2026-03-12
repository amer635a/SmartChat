from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/chat/{session_id}")
async def chat_endpoint(websocket: WebSocket, session_id: str):
    from app.main import connection_manager, session_manager, flow_engine, classifier

    await connection_manager.connect(session_id, websocket)
    session = session_manager.get_or_create(session_id)

    # Send welcome message
    await websocket.send_json({
        "type": "text",
        "content": "Welcome to SmartChat! How can I help you today?"
    })

    try:
        while True:
            data = await websocket.receive_json()

            # Send typing indicator
            await websocket.send_json({"type": "typing", "content": "true"})

            # Normalize incoming message to user_text
            msg_type = data.get("type", "user_message")

            if msg_type == "reset":
                session.reset()
                await websocket.send_json({"type": "typing", "content": "false"})
                await websocket.send_json({
                    "type": "text",
                    "content": "Welcome to SmartChat! How can I help you today?"
                })
                continue

            if msg_type == "user_message":
                user_text = data.get("content", "")
            elif msg_type == "choice_response":
                user_text = data.get("value", "")
            elif msg_type == "input_response":
                input_key = data.get("input_key", "")
                user_text = data.get("value", "")
                if input_key:
                    session.collected_inputs[input_key] = user_text
            else:
                user_text = data.get("content", "")

            # Process through flow engine
            responses = await flow_engine.handle_message(session, user_text, classifier)

            # Stop typing indicator
            await websocket.send_json({"type": "typing", "content": "false"})

            # Send all responses
            for resp in responses:
                await websocket.send_json(resp.model_dump(exclude_none=True))

    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
        session_manager.remove_session(session_id)

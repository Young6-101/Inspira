from backend.rag_engine.vector_store import InspiraVault
from backend.reasoning.memory_store import MemoryStore
from backend.reasoning.model_client import get_llm
from backend.reasoning.state import GraphState
from backend.settings import settings
from langchain_core.prompts import ChatPromptTemplate


vault = InspiraVault()
memory_store = MemoryStore()


def memory_retrieve_node(state: GraphState):
    """Load short/mid-term memory from Redis for this user session."""
    print("--- [AGENT] Loading STM/MTM memory ---")

    stm_turns = memory_store.get_recent_turns(state["user_id"], state["session_id"])
    mtm_items = memory_store.get_mid_summaries(state["user_id"], state["stack_id"], top_k=3)

    stm_text = "\n".join(
        [f"- Q: {turn.get('q', '')}\n  A: {str(turn.get('a', ''))[:260]}" for turn in stm_turns]
    )
    mtm_text = "\n".join([f"- {item.get('summary', '')}" for item in mtm_items])

    return {"stm_text": stm_text, "mtm_text": mtm_text}


def retrieve_node(state: GraphState):
    """Retrieve relevant fragments from Chroma long-term memory."""
    print("--- [AGENT] Retrieving relevant context from vector store ---")
    context = vault.search(state["stack_id"], state["question"], top_k=5)
    return {"context": context}


def generate_node(state: GraphState):
    """Generate answer by combining STM/MTM memory with retrieved LTM context."""
    print("--- [AGENT] Generating answer with model ---")

    context = state.get("context", [])
    stm_text = state.get("stm_text", "")
    mtm_text = state.get("mtm_text", "")

    if not context:
        system_prompt = (
            "You are 'Inspira', an AI assistant. The user hasn't uploaded any materials to this stack yet, "
            "or no relevant context was found. Let them know they can upload files (PDF, PPT, images, audio, text) "
            "and then ask questions to find patterns and insights."
        )
    else:
        mode_instructions = {
            "patterns": "Identify common themes, recurring patterns, and synthesize a cohesive overview.",
            "summarize": "Provide a concise and structured summary of the core points and key takeaways without fluff.",
            "compare": "Analyze the context to compare different concepts, highlighting similarities and exact differences.",
            "brainstorm": "Use the context as inspiration to generate highly creative, out-of-the-box ideas and novel suggestions.",
            "custom": "Follow the user's specific instructional query exactly as requested, using the context.",
        }
        instruction = mode_instructions.get(state["mode"], mode_instructions["patterns"])
        context_text = "\n\n".join(f"[Fragment {i + 1}]: {chunk}" for i, chunk in enumerate(context))

        system_prompt = f"""You are 'Inspira', an AI assistant operating in '{state['mode']}' mode.
Your goal is to process the user's uploaded materials (documents, images, audio transcripts, notes) to help them.

CRITICAL INSTRUCTION:
{instruction}

Short-term Conversation Memory (latest turns):
{stm_text if stm_text else '[none]'}

Mid-term Memory Summaries:
{mtm_text if mtm_text else '[none]'}

Retrieved Context:
{context_text}"""

    model_name = state["model"]
    if settings.app_mode == "local" and ((not model_name) or model_name.startswith("gpt-")):
        model_name = settings.ollama_chat_model

    llm = get_llm(model=model_name, temperature=0.7)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}"),
            ("human", "{question}"),
        ]
    )
    chain = prompt | llm
    response = chain.invoke({"system_prompt": system_prompt, "question": state["question"]})
    answer = response.content if isinstance(response.content, str) else str(response.content)

    return {"answer": answer}


def memory_write_node(state: GraphState):
    """Write back answer to STM and periodically summarize to MTM."""
    print("--- [AGENT] Writing memory (STM/MTM) ---")

    answer = state.get("answer", "")
    memory_store.append_turn(state["user_id"], state["session_id"], state["question"], answer)

    if memory_store.should_summarize(state["user_id"], state["session_id"]):
        turns = memory_store.get_recent_turns(state["user_id"], state["session_id"], max_turns=6)
        if turns:
            raw_summary = " | ".join(
                [f"Q:{t.get('q', '')} A:{str(t.get('a', ''))[:120]}" for t in turns]
            )
            memory_store.upsert_mid_summary(
                state["user_id"],
                state["stack_id"],
                state["session_id"],
                summary=raw_summary[:1200],
                importance=0.7,
            )

    return {}

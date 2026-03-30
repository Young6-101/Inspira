from fastapi import APIRouter, Depends
from openai import OpenAI

from ...core.dependencies import get_openai_client, get_vault
from ..schemas import ChatRequest, ChatResponse
from ....rag_engine.vector_store import InspiraVault

router = APIRouter()

MODE_INSTRUCTIONS = {
	"patterns": "Identify common themes, recurring patterns, and synthesize a cohesive overview.",
	"summarize": "Provide a concise and structured summary of the core points and key takeaways without fluff.",
	"compare": "Analyze the context to compare different concepts, highlighting similarities and exact differences.",
	"brainstorm": "Use the context as inspiration to generate highly creative, out-of-the-box ideas and novel suggestions.",
	"custom": "Follow the user's specific instructional query exactly as requested, using the context.",
}


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
	request: ChatRequest,
	vault: InspiraVault = Depends(get_vault),
	openai_client: OpenAI = Depends(get_openai_client),
):
	try:
		context_chunks = vault.search(request.stack_id, request.question, top_k=5)

		if not context_chunks:
			system_prompt = (
				"You are 'Inspira', an AI assistant. The user has not uploaded any materials to this "
				"stack yet, or no relevant context was found. Let them know they can upload files "
				"(PDF, PPT, images, audio, text) and then ask questions to find patterns and insights."
			)
		else:
			context_text = "\n\n".join(
				f"[Fragment {index + 1}]: {chunk}" for index, chunk in enumerate(context_chunks)
			)
			instruction = MODE_INSTRUCTIONS.get(request.mode, MODE_INSTRUCTIONS["patterns"])

			system_prompt = f"""You are 'Inspira', an AI assistant operating in '{request.mode}' mode.
Your goal is to process the user's uploaded materials (documents, images, audio transcripts, notes) to help them.

CRITICAL INSTRUCTION:
{instruction}

Retrieved Context:
{context_text}"""

		response = openai_client.chat.completions.create(
			model=request.model,
			messages=[
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": request.question},
			],
			temperature=0.7,
			max_tokens=1000,
		)

		answer = response.choices[0].message.content or ""
		return ChatResponse(answer=answer)

	except Exception as exc:
		return ChatResponse(answer=f"Error: {str(exc)}")


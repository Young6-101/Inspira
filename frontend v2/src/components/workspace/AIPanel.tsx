import { ArrowRight, Asterisk, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceNodeData } from '../../types/workspace';

type AIPanelProps = {
  visible: boolean;
  onClose: () => void;
  workspaceNodes?: WorkspaceNodeData[];
  onGenerateClusters?: () => Promise<void> | void;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type StructuredAIAnswer = {
  answer: string;
  finalAnswer?: string;
};

function parseStructuredAIAnswer(raw: string): StructuredAIAnswer | null {
  const text = raw.trim();
  if (!text) return null;

  const parse = (input: string): StructuredAIAnswer | null => {
    try {
      const obj = JSON.parse(input) as Partial<StructuredAIAnswer>;
      if (!obj || typeof obj.answer !== 'string') return null;
      return {
        answer: obj.answer.trim(),
        finalAnswer: typeof obj.finalAnswer === 'string' ? obj.finalAnswer.trim() : undefined
      };
    } catch {
      return null;
    }
  };

  const direct = parse(text);
  if (direct) return direct;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return parse(text.slice(start, end + 1));
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string | null> {
  try {
    const res = await fetch(blobUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function AIPanel({ visible, onClose, workspaceNodes = [], onGenerateClusters }: AIPanelProps) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const nodeContext = useMemo(
    () =>
      workspaceNodes.map((node) => ({
        id: node.id,
        type: node.type,
        label: node.label ?? '',
        textPreview: (node.textPreview ?? '').slice(0, 280),
        url: node.url ?? ''
      })),
    [workspaceNodes]
  );

  const imageNodes = useMemo(() => workspaceNodes.filter((n) => n.type === 'image' && Boolean(n.imageSrc)), [workspaceNodes]);
  const urlNodes = useMemo(() => workspaceNodes.filter((n) => n.type === 'url' && Boolean(n.url)), [workspaceNodes]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [draft]);

  const sendMessage = async (overrideMessage?: string) => {
    const content = (overrideMessage ?? draft).trim();
    if (!content || loading) return;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content },
        { id: crypto.randomUUID(), role: 'assistant', content: 'Missing VITE_OPENAI_API_KEY in .env.local' }
      ]);
      if (!overrideMessage) {
        setDraft('');
      }
      return;
    }

    const nextUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((prev) => [...prev, nextUserMessage]);
    if (!overrideMessage) {
      setDraft('');
    }
    setLoading(true);

    try {
      const imagePayloads = await Promise.all(
        imageNodes.map(async (node) => {
          if (!node.imageSrc) return null;
          const dataUrl = await blobUrlToDataUrl(node.imageSrc);
          if (!dataUrl) return null;
          return {
            id: node.id,
            label: node.label ?? '',
            dataUrl
          };
        })
      );

      const validImagePayloads = imagePayloads.filter((item): item is { id: string; label: string; dataUrl: string } => Boolean(item));

      const prompt = [
        'You are a workspace copilot. Answer briefly and concretely.',
        'You MUST use all available evidence types: text, URL, and image nodes.',
        'Do not claim preferences are unknown if there is any evidence in text labels, URL domains, or attached images.',
        'Goal: aggregate similar materials and provide one precise final answer with no redundancy.',
        'Return ONLY strict JSON with schema: {"answer": string, "finalAnswer"?: string}.',
        'Do not add markdown.',
        'Workspace nodes:',
        JSON.stringify(nodeContext),
        'URL nodes (explicit):',
        JSON.stringify(urlNodes.map((n) => ({ id: n.id, label: n.label ?? '', url: n.url ?? '' }))),
        'Attached images metadata:',
        JSON.stringify(validImagePayloads.map((img) => ({ id: img.id, label: img.label }))),
        'User question:',
        content
      ].join('\n');

      const contentParts: Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }> = [
        { type: 'input_text', text: prompt }
      ];

      validImagePayloads.forEach((img) => {
        contentParts.push({ type: 'input_image', image_url: img.dataUrl });
      });

      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          input: [
            {
              role: 'user',
              content: contentParts
            }
          ],
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const text = await res.text();
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Request failed: ${res.status} ${text.slice(0, 180)}` }]);
        return;
      }

      const data = await res.json();
      const rawAnswer =
        (typeof data.output_text === 'string' && data.output_text) ||
        (Array.isArray(data.output)
          ? data.output
              .flatMap((item: any) => (Array.isArray(item.content) ? item.content : []))
              .map((c: any) => c.text || '')
              .join('\n')
          : '') ||
        'No response text.';

      const structured = parseStructuredAIAnswer(rawAnswer);

      if (structured) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: structured.finalAnswer || structured.answer || 'No response text.'
          }
        ]);
        return;
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: rawAnswer.trim() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Request error: ${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`bg-white flex flex-col shrink-0 transition-all duration-300 ease-out relative z-30 overflow-hidden ${visible ? 'w-[360px] border-l border-textBlack' : 'w-0 border-l-0 pointer-events-none'}`}
    >
      <div className="h-14 border-b-2 border-textBlack flex items-center justify-between px-4 shrink-0 bg-bgCream">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-textBlack">
          <Asterisk size={14} weight="bold" className="text-accentCoral" /> Synthesizer
        </div>
        <button onClick={onClose} className="w-8 h-8 border border-textBlack flex items-center justify-center hover:bg-accentCoral transition-colors bg-white">
          <X size={14} weight="bold" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-white">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System</span>
          <div className="border border-textBlack p-4 text-sm bg-bgCream font-medium shadow-[2px_2px_0px_#111]">
            <div className="mb-3">{workspaceNodes.length} nodes loaded.</div>
            <button
              onClick={async () => {
                await onGenerateClusters?.();
                await sendMessage('Find key patterns and inspiration across all workspace nodes. Then suggest the best next actions for execution.');
              }}
              disabled={loading}
              className="w-full text-left border border-textBlack bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-accentElectric/20 disabled:opacity-50"
            >
              Find patterns and provide inspiration.
            </button>
          </div>
        </div>

        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{message.role}</span>
            <div className={`border border-textBlack p-3 text-sm font-medium shadow-[2px_2px_0px_#111] whitespace-pre-wrap ${message.role === 'assistant' ? 'bg-bgCream' : 'bg-white'}`}>
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-[11px] uppercase tracking-widest font-bold text-gray-500">Thinking...</div>
        )}
      </div>
      <div className="p-4 border-t-2 border-textBlack bg-bgCream shrink-0">
        <div className="relative bg-white border border-textBlack shadow-[2px_2px_0px_#111]">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ask AI..."
            rows={1}
            className="w-full bg-transparent border-none py-3 pl-4 pr-12 text-sm font-medium placeholder-gray-500 focus:outline-none resize-none overflow-y-auto max-h-[180px]"
          />
          <button onClick={() => void sendMessage()} disabled={loading} className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-textBlack text-white hover:bg-accentElectric hover:text-textBlack border border-textBlack transition-colors disabled:opacity-50">
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Enter for newline · Ctrl/Cmd + Enter to send</div>
      </div>
    </aside>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stack } from "../hooks/useStack";
import { callApi, uploadApi } from "../utils/api";

interface StackDetailPageProps {
    stack: Stack;
    onClose: () => void;
    updateFileCount?: (id: string, count: number) => void;
}

interface UploadedFile {
    file: File;
    displayName: string;
}

const getFileType = (fileName: string): 'image' | 'audio' | 'video' | 'text' | 'other' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) return 'audio';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return 'video';
    if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'md'].includes(ext)) return 'text';
    return 'other';
};

const FileIcon = ({ file, displayName, onRename }: { file: File; displayName: string; onRename: (newName: string) => void }) => {
    const [thumbnail, setThumbnail] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(displayName);
    const fileType = getFileType(file.name);

    // Generate thumbnail for images
    useEffect(() => {
        if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => setThumbnail(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    }, [file, fileType]);

    const handleRename = () => {
        if (editName.trim()) {
            onRename(editName);
            setIsEditing(false);
        }
    };

    const IconDisplay = () => {
        if (fileType === 'image' && thumbnail) {
            return (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
                    <img src={thumbnail} alt={file.name} className="w-full h-full object-cover" />
                </div>
            );
        }

        if (fileType === 'text') {
            return (
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200">
                    <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                        <path d="M8 12h8v2H8zm0 4h5v2H8z" />
                    </svg>
                </div>
            );
        }

        if (fileType === 'audio') {
            return (
                <div className="w-16 h-16 flex items-center justify-center bg-purple-50 rounded-lg border-2 border-purple-200">
                    <svg className="w-10 h-10 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zm-2 14a2 2 0 1 1 2-2 2 2 0 0 1-2 2z" />
                    </svg>
                </div>
            );
        }

        if (fileType === 'video') {
            return (
                <div className="w-16 h-16 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
                    <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                </div>
            );
        }

        return (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200">
                <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                </svg>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center gap-2 p-3 cursor-pointer group" onDoubleClick={() => setIsEditing(true)}>
            <IconDisplay />
            {isEditing ? (
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    autoFocus
                    className="text-xs text-center bg-white border border-[#0a86ce] rounded px-2 py-1 w-full"
                />
            ) : (
                <span className="text-xs text-gray-600 text-center w-full break-words group-hover:text-[#0a86ce]">
                    {displayName}
                </span>
            )}
        </div>
    );
};

const MODES = [
    { value: "patterns", label: "🔍 Find Patterns" },
    { value: "summarize", label: "📝 Summarize" },
    { value: "compare", label: "⚖️ Compare" },
    { value: "brainstorm", label: "💡 Brainstorm" },
    { value: "custom", label: "✏️ Custom" },
];

const MODELS = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
    { value: "gpt-4o", label: "GPT-4o (Best)" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Cheap)" },
];

export const StackDetailPage = ({ stack, onClose, updateFileCount }: StackDetailPageProps) => {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [_isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [mode, setMode] = useState("patterns");
    const [model, setModel] = useState("gpt-4o-mini");
    const [showMobileChat, setShowMobileChat] = useState(false);

    useEffect(() => {
        if (updateFileCount) {
            updateFileCount(stack.id, uploadedFiles.length);
        }
    }, [uploadedFiles.length, stack.id, updateFileCount]);

    // Upload file to backend
    const uploadToBackend = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("stack_id", stack.id);
        try {
            const res = await uploadApi("/api/upload", formData);
            const data = await res.json();
            console.log("Upload result:", data);
            return data;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    const handleSend = async () => {
        if (!message.trim() || isSending) return;
        const userMsg = message;
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setMessage("");
        setIsSending(true);

        try {
            const res = await callApi("/api/chat", { question: userMsg, stack_id: stack.id, mode, model });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: 'ai', content: 'Error connecting to backend.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        const newFiles = files.map(file => ({ file, displayName: file.name }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
        // Upload each file to backend
        setIsUploading(true);
        for (const f of files) { await uploadToBackend(f); }
        setIsUploading(false);
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newFiles = files.map(file => ({ file, displayName: file.name }));
            setUploadedFiles(prev => [...prev, ...newFiles]);
            setIsUploading(true);
            for (const f of files) { await uploadToBackend(f); }
            setIsUploading(false);
        }
    };

    const handleRename = (index: number, newName: string) => {
        setUploadedFiles(prev => prev.map((item, i) =>
            i === index ? { ...item, displayName: newName } : item
        ));
    };

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#f9f9f9] z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 shrink-0">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#0a86ce]">
                        {stack.name}
                    </h1>
                    <p className="mt-1 text-xs text-gray-400">
                        Created on {new Date(stack.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:scale-110 transition-transform text-sm"
                >
                    ←
                </button>
            </div>

            {/* Main Content: Left (Files) + Right (Chat) */}
            <div className="flex flex-1 overflow-hidden">

                {/* ===== LEFT: File Upload Zone ===== */}
                <div className="flex-1 relative overflow-y-auto">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`min-h-full p-6 transition-colors ${isDragging ? 'bg-blue-50/40' : ''}`}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {uploadedFiles.length > 0 ? (
                            <div className="grid grid-cols-4 xl:grid-cols-5 gap-4 relative z-20 pointer-events-none">
                                {uploadedFiles.map((item, idx) => (
                                    <div key={idx} className="pointer-events-auto">
                                        <FileIcon
                                            file={item.file}
                                            displayName={item.displayName}
                                            onRename={(newName) => handleRename(idx, newName)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] pointer-events-none">
                                <div className="w-20 h-20 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <p className="text-base font-semibold text-gray-400">
                                    Drag and drop files here
                                </p>
                                <p className="text-sm text-gray-300 mt-1">
                                    or click to browse
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Chat Toggle FAB */}
                <button
                    onClick={() => setShowMobileChat(!showMobileChat)}
                    className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-[#0a86ce] text-white rounded-full flex items-center justify-center shadow-2xl z-[60]"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>

                {/* ===== RIGHT: Chat Panel ===== */}
                <div className={`
                    absolute md:relative top-0 right-0 bottom-0 z-50
                    w-[85vw] md:w-[480px] xl:w-[560px] 2xl:w-[640px] 
                    border-l border-gray-200 bg-white flex flex-col shrink-0
                    transition-transform duration-300 shadow-2xl md:shadow-none
                    ${showMobileChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>

                    {/* Chat Header */}
                    <div className="px-5 py-3 border-b border-gray-100 flex flex-col gap-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                            AI Assistant
                        </p>
                        <div className="flex gap-2">
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0a86ce]"
                            >
                                {MODES.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0a86ce]"
                            >
                                {MODELS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-12 h-12 rounded-full bg-[#0a86ce]/10 flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-[#0a86ce]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">Ask AI about your uploads</p>
                                <p className="text-xs text-gray-300 mt-1">Upload files, then ask questions to find patterns</p>
                            </div>
                        )}

                        {chatHistory.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-[#0a86ce] text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}

                        {isSending && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="flex gap-2 items-end">
                            <textarea
                                rows={1}
                                className="flex-1 px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0a86ce] transition-colors resize-none overflow-y-auto min-h-[44px] max-h-[200px]"
                                placeholder="Ask about your uploads... (Shift+Enter for newline)"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                        e.currentTarget.style.height = 'auto';
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    handleSend();
                                    const textarea = document.querySelector('textarea');
                                    if (textarea) textarea.style.height = 'auto';
                                }}
                                disabled={isSending}
                                className="px-4 py-3 h-[44px] bg-[#0a86ce] text-white text-sm font-medium rounded-xl hover:bg-[#0970a8] transition-colors disabled:opacity-50 shrink-0"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

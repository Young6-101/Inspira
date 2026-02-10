import { useState } from "react";
import { motion } from "framer-motion";
import { Stack } from "../hooks/useStack";

interface StackDetailPageProps {
    stack: Stack;
    onClose: () => void;
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
    if (fileType === 'image' && !thumbnail) {
        const reader = new FileReader();
        reader.onload = (e) => setThumbnail(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    const handleRename = () => {
        if (editName.trim()) {
            onRename(editName);
            setIsEditing(false);
        }
    };

    const IconDisplay = () => {
        if (fileType === 'image' && thumbnail) {
            return (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-default-200 bg-white">
                    <img src={thumbnail} alt={file.name} className="w-full h-full object-cover" />
                </div>
            );
        }

        if (fileType === 'text') {
            return (
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border-2 border-default-200">
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
                <span className="text-xs text-default-600 text-center w-full break-words group-hover:text-[#0a86ce]">
                    {displayName}
                </span>
            )}
        </div>
    );
};

export const StackDetailPage = ({ stack, onClose }: StackDetailPageProps) => {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai', content: string }>>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleSend = () => {
        if (!message.trim()) return;

        setChatHistory(prev => [...prev, { role: 'user', content: message }]);
        setMessage("");

        setTimeout(() => {
            setChatHistory(prev => [...prev, {
                role: 'ai',
                content: `I received your message: "${message}". This is a placeholder response.`
            }]);
        }, 500);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const newFiles = files.map(file => ({ file, displayName: file.name }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newFiles = files.map(file => ({ file, displayName: file.name }));
            setUploadedFiles(prev => [...prev, ...newFiles]);
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
            <div className="flex items-center justify-between p-8 border-b border-default-200">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-[#0a86ce]">
                        {stack.name}
                    </h1>
                    <p className="mt-2 text-sm text-default-400">
                        Created on {new Date(stack.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-default-900 text-white flex items-center justify-center hover:scale-110 transition-transform"
                >
                    ←
                </button>
            </div>

            {/* Main Content Area - Full Height Drag Zone */}
            <div className="relative" style={{ minHeight: '400px' }}>
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`absolute inset-0 transition-colors ${isDragging ? 'bg-blue-50/30' : ''
                        }`}
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {uploadedFiles.length > 0 && (
                        <div className="p-8 overflow-y-auto h-full pointer-events-none pb-32">
                            <div className="grid grid-cols-6 gap-6">
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
                        </div>
                    )}

                    {/* Hint Always Visible at Bottom */}
                    <div className="absolute bottom-24 left-0 right-0 text-center pointer-events-none">
                        <div className="w-20 h-20 mx-auto mb-4 border-2 border-dashed border-default-300 rounded-lg flex items-center justify-center">
                            <svg className="w-10 h-10 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="text-lg font-semibold text-default-400">
                            Drag and drop files here or click to browse
                        </p>
                    </div>

                    {/* Chat History Overlay */}
                    {chatHistory.length > 0 && (
                        <div className="absolute top-8 left-8 right-8 pointer-events-none">
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {chatHistory.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-[#0a86ce] text-white'
                                            : 'bg-white border border-default-200 text-default-900'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Dialogue Input at Bottom */}
            <div className="pb-4 pt-6 px-4 bg-[#f9f9f9]">
                <div className="max-w-4xl mx-auto">
                    <div className="relative w-full bg-gray-100 rounded-2xl shadow-md p-1.5 transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-lg">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-8 pr-24 py-3 text-base text-gray-700 bg-transparent rounded-lg focus:outline-none"
                            placeholder="Ask AI a question..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            className="absolute right-1 top-1 bottom-1 px-6 bg-[#0a86ce] text-white font-medium rounded-xl hover:bg-[#0970a8] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0a86ce]"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

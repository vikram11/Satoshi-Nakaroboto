import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Bot, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'I have been trained on all known writings of Satoshi Nakamoto, including the Bitcoin White Paper, emails, forum posts, and messages, as contained in the Book of Satoshi. What would you like to discuss?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [webSearch, setWebSearch] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, web_search: webSearch })
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                sources: data.sources
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'ERROR: Network partition detected. Unable to reach consensus.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6">
            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar"
            >
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                                <Bot size={16} className="text-secondary" />
                            </div>
                        )}

                        <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-lg font-mono text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : 'bg-background text-secondary border border-secondary/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]'
                            }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>

                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-dashed border-secondary/20">
                                    <p className="text-[10px] text-secondary/60 mb-1">REFERENCE_BLOCKS:</p>
                                    {msg.sources.map((src, i) => (
                                        <div key={i} className="text-[10px] text-neutral-500 truncate mb-1">
                                            &gt; {src.slice(0, 80)}...
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                                <User size={16} className="text-neutral-400" />
                            </div>
                        )}
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                            <Loader2 size={16} className="text-secondary animate-spin" />
                        </div>
                        <div className="flex items-center gap-1 text-secondary font-mono text-sm">
                            <span className="typing-cursor">Generating block...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-black rounded-lg border border-neutral-800 flex items-end p-2 gap-2">

                    <button
                        onClick={() => setWebSearch(!webSearch)}
                        className={`p-2 rounded-md transition-colors ${webSearch ? 'text-blue-400 bg-blue-400/10' : 'text-neutral-600 hover:text-neutral-400'}`}
                        title="Enable Web Search"
                    >
                        <Globe size={20} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Satoshi..."
                        className="w-full bg-transparent border-none outline-none text-neutral-200 font-mono text-sm resize-none py-2 max-h-32 custom-scrollbar placeholder-neutral-700"
                        rows={1}
                    />

                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-2 rounded-md bg-neutral-900 text-secondary border border-neutral-800 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

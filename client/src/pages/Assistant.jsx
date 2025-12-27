import { useState, useRef, useEffect } from 'react';
import { Card, Title, Text, Button, TextInput } from '@tremor/react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useDisk } from '../context/DiskContext';

export default function Assistant() {
    const { scanResults, disks } = useDisk();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your Disk Intelligence Assistant. I can help analyzing your storage usage. Try asking "Why is my C: drive full?"' }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);

        // Simulate AI thinking based on context
        setTimeout(() => {
            let response = "I'm not sure about that specific query, but I can help analysis your disk space.";

            const lowerInput = userMsg.content.toLowerCase();

            if (lowerInput.includes('full') || lowerInput.includes('space')) {
                const fullDisk = disks.find(d => d.usePercent > 80);
                if (fullDisk) {
                    response = `I noticed your ${fullDisk.mount} drive is at ${fullDisk.usePercent}% capacity. This is critical. I recommend running the "Cleanup" tool immediately to remove temp files.`;
                } else {
                    response = "Your disks look healthy right now! No drives are critically full.";
                }
            } else if (lowerInput.includes('large') || lowerInput.includes('big')) {
                if (scanResults) {
                    response = `Based on the latest scan of ${scanResults.path}, the largest category is usually "${Object.keys(scanResults.categories)[0]}". You might want to check the "Space Analyzer" for details.`;
                } else {
                    response = "I haven't seen a scan result yet. Please run a scan in the Analyzer tab first so I can identify large files.";
                }
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                response = "Hi there! Ready to clean up some junk?";
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setTyping(false);
        }, 1500);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Sparkles className="text-purple-500" />
                        Smart Assistant
                    </h2>
                    <p className="text-slate-500 mt-1">AI-powered storage recommendations</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col bg-white ring-1 ring-slate-200 overflow-hidden p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg flex gap-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-purple-100 text-purple-600'}`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className="text-sm leading-relaxed">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {typing && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
                                <Bot size={14} className="text-purple-500" />
                                <span className="text-xs text-slate-400 italic">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <TextInput
                        placeholder="Ask about your disk usage..."
                        value={input}
                        onValueChange={setInput}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button icon={Send} onClick={handleSend} color="purple">
                        Send
                    </Button>
                </div>
            </Card>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, PaperAirplaneIcon, XIcon } from './icons/Icons';
import { GoogleGenAI, Chat } from '@google/genai';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
      { sender: 'ai', text: "Hello! I'm SwasthyaSense's AI assistant. How can I help you understand your results today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isAiTyping]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isAiTyping) return;

    const userMessage: Message = { text: inputValue, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsAiTyping(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const history = newMessages.slice(0, -1).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        const chat: Chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a helpful and friendly AI assistant for SwasthyaSense, a healthcare platform. Your role is to answer user questions about medical terms, reports, and general health topics in a clear and understandable way. IMPORTANT: You must never provide medical advice, diagnoses, or treatment plans. You MUST ALWAYS include a disclaimer in your responses that users should consult with a qualified healthcare professional for any medical concerns. For example: 'Please remember, this is for informational purposes only. Always consult your doctor for medical advice.'",
            },
            history: history,
        });
        
        const response = await chat.sendMessage({ message: userMessage.text });
      
        const aiResponse: Message = { sender: 'ai', text: response.text };
        setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
        console.error("Error generating AI response:", error);
        const errorResponse: Message = { sender: 'ai', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsAiTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-secondary hover:scale-110 text-black p-4 rounded-full shadow-lg transition-transform duration-300 z-50"
        aria-label="Open Chat Assistant"
      >
        <ChatIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[28rem] bg-light-navy rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-in-up">
      <header className="flex justify-between items-center p-4 bg-lightest-navy rounded-t-2xl border-b border-lightest-navy/50">
        <h3 className="font-bold text-slate-200">AI Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate hover:text-slate-200">
          <XIcon className="h-6 w-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-black rounded-br-lg' : 'bg-lightest-navy text-light-slate rounded-bl-lg'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isAiTyping && (
            <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-lightest-navy text-light-slate rounded-bl-lg">
                    <div className="flex items-center justify-center space-x-1 h-4">
                        <span className="h-2 w-2 bg-slate rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-slate rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-slate rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-lightest-navy/50">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isAiTyping ? "AI is thinking..." : "Ask a question..."}
            disabled={isAiTyping}
            className="w-full bg-lightest-navy border-transparent rounded-full py-2 pl-4 pr-12 focus:ring-primary focus:border-primary text-sm disabled:opacity-50"
          />
          <button type="submit" disabled={isAiTyping} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-secondary text-black rounded-full disabled:bg-slate disabled:opacity-50">
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;
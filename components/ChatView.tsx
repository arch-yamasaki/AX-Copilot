import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Carte } from '../types';
import { useDiscoveryBot } from '../hooks/useDiscoveryBot';
import { LogoIcon } from './icons/LogoIcon';
import { SendIcon } from './icons/SendIcon';

interface ChatViewProps {
  onCarteGenerated: (carte: Carte) => void;
}

const GeneratingCarteView: React.FC = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center p-4">
        <LogoIcon className="h-16 w-16 text-blue-600 animate-pulse" />
        <h2 className="text-2xl font-bold text-gray-800 mt-6">AIが業務カルテを生成中です...</h2>
        <p className="text-gray-600 mt-2">分析が完了するまで、しばらくお待ちください。</p>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-blue-600 animate-progress w-full"></div>
        </div>
        <style>{`
            @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .animate-progress {
                animation: progress 2s ease-in-out infinite;
            }
        `}</style>
    </div>
);


const ChatView: React.FC<ChatViewProps> = ({ onCarteGenerated }) => {
    const { messages, handleUserInput, isThinking, isGenerating } = useDiscoveryBot(onCarteGenerated);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    const lastBotMessage = useMemo(() => messages.filter(m => m.sender === 'bot').pop(), [messages]);
    
    const inputConfig = useMemo(() => {
        if (!lastBotMessage || isThinking) return { type: 'hidden' };
        const text = lastBotMessage.text || '';
        if (text.includes('何分') || text.includes('分で')) {
            return { type: 'slider', unit: '分', min: 5, max: 480, step: 5, label: '時間（分）' };
        }
        if (text.includes('何時間')) {
            return { type: 'slider', unit: '時間', min: 1, max: 24, step: 1, label: '時間' };
        }
        if (text.includes('何回') || text.includes('回数')) {
            return { type: 'slider', unit: '回', min: 1, max: 100, step: 1, label: '回数' };
        }
        return { type: 'text' };
    }, [lastBotMessage, isThinking]);
    
    const [sliderValue, setSliderValue] = useState(30);

    useEffect(() => {
        if (inputConfig.type === 'slider') {
            switch (inputConfig.unit) {
                case '分': setSliderValue(30); break;
                case '時間': setSliderValue(2); break;
                case '回': setSliderValue(10); break;
                default: setSliderValue(inputConfig.min || 0);
            }
        }
    }, [inputConfig]);

    const handleSend = () => {
        if (inputValue.trim() && !isThinking) {
            handleUserInput(inputValue.trim());
            setInputValue('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (!isThinking) {
            handleUserInput(suggestion);
        }
    };
    
    const handleSliderSend = () => {
        if (inputConfig.type === 'slider' && inputConfig.unit) {
            handleUserInput(`${sliderValue}${inputConfig.unit}`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    const renderInput = () => {
        if (inputConfig.type === 'hidden') return null;
        
        if (inputConfig.type === 'slider') {
             return (
                <div className="bg-white border-t border-gray-200 rounded-t-xl p-4 sm:p-6 flex flex-col items-center gap-4">
                    <div className="w-full max-w-md">
                         <div className="flex justify-between items-center mb-2 text-gray-700">
                             <label htmlFor="slider" className="text-sm font-medium">{inputConfig.label}</label>
                             <span className="px-3 py-1 text-base font-bold text-blue-600 bg-blue-50 rounded-full">{sliderValue} {inputConfig.unit}</span>
                         </div>
                         <input id="slider" type="range" min={inputConfig.min} max={inputConfig.max} step={inputConfig.step} value={sliderValue} onChange={(e) => setSliderValue(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                    <button onClick={handleSliderSend} className="w-full max-w-md flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-semibold">
                        <SendIcon className="h-5 w-5" />
                        <span>決定して送信</span>
                    </button>
                </div>
             );
        }
        
        if (inputConfig.type === 'text') {
            return (
                <div className="bg-white border-t border-gray-200 rounded-t-xl p-4">
                    {lastBotMessage?.suggestions && lastBotMessage.suggestions.length > 0 && !isThinking && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {lastBotMessage.suggestions.map((suggestion, i) => (
                                <button key={i} onClick={() => handleSuggestionClick(suggestion)} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors">
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="メッセージを入力..."
                            disabled={isThinking}
                            className="flex-grow bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none px-3 py-2"
                        />
                        <button onClick={handleSend} disabled={isThinking || !inputValue.trim()} className="p-2 text-white bg-blue-600 rounded-full disabled:bg-gray-400 hover:bg-blue-700 transition-all duration-200 transform disabled:scale-100 hover:scale-110 focus:outline-none">
                            <SendIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {isGenerating && <GeneratingCarteView />}
            <div className="flex-grow overflow-y-auto pb-40 pt-8 px-4">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><LogoIcon className="h-5 w-5 text-white" /></div>}
                            <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'bot' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'bg-blue-600 text-white shadow-sm'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isThinking && messages.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><LogoIcon className="h-5 w-5 text-white" /></div>
                            <div className="max-w-xl p-4 rounded-2xl bg-white shadow-sm border border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-0 left-0 right-0">
                <div className="max-w-4xl mx-auto">
                    {!isGenerating && renderInput()}
                </div>
            </div>
        </div>
    );
};

export default ChatView;

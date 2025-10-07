import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, Carte } from '../types';
import { createChat, generateCarteData } from '../services/geminiService';
import { Chat } from '@google/genai';

const GENERATE_COMMAND = '[GENERATE_CARTE]';

export const useDiscoveryBot = (onCarteGenerated: (carte: Carte) => void) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const chatRef = useRef<Chat | null>(null);

    const addMessage = useCallback((sender: 'user' | 'bot', text: string, suggestions?: string[]) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, suggestions }]);
    }, []);
    
    const processFinalGeneration = useCallback(async () => {
        setIsThinking(false);
        setIsGenerating(true);
        addMessage('bot', 'ありがとうございます。すべてのヒアリングが完了しました。業務カルテを生成しています...');
        try {
            // Exclude the last bot message which is the generation command
            const history = messages.slice(0, -1);
            const carte = await generateCarteData(history);
            onCarteGenerated(carte);
        } catch (err) {
            console.error(err);
            addMessage('bot', '申し訳ありません、カルテの生成に失敗しました。もう一度お試しください。');
            setIsGenerating(false);
        }
        // No finally block needed here as view will change
    }, [messages, addMessage, onCarteGenerated]);

    const startConversation = useCallback(async () => {
        chatRef.current = createChat();
        setIsThinking(true);
        try {
            const responseStream = await chatRef.current.sendMessageStream({ message: "対話を開始してください" });
            let responseText = '';
            for await (const chunk of responseStream) {
                responseText += chunk.text;
            }
            handleBotResponse(responseText);
        } catch (error) {
            console.error("Error starting conversation:", error);
            addMessage('bot', 'チャットの開始に失敗しました。ページをリロードしてください。');
        } finally {
            setIsThinking(false);
        }
    }, [addMessage]);

    useEffect(() => {
        startConversation();
    }, [startConversation]);

    const handleBotResponse = (text: string) => {
        if (text.includes(GENERATE_COMMAND)) {
            processFinalGeneration();
            return;
        }

        try {
            let jsonString = text.trim();
            
            // Handle markdown code blocks that Gemini sometimes adds
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.length - 3).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.length - 3).trim();
            }

            const jsonStart = jsonString.indexOf('{');
            if (jsonStart === -1) {
                addMessage('bot', text); // Fallback for non-JSON text
                return;
            }

            // To robustly parse JSON from a stream that might contain multiple objects
            // or trailing text, we need to find the boundary of the first valid object.
            let braceCount = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < jsonString.length; i++) {
                if (jsonString[i] === '{') {
                    braceCount++;
                } else if (jsonString[i] === '}') {
                    braceCount--;
                }
                if (braceCount === 0) {
                    jsonEnd = i;
                    break;
                }
            }

            if (jsonEnd !== -1) {
                const firstJsonObjectString = jsonString.substring(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(firstJsonObjectString);
                addMessage('bot', parsed.text, parsed.suggestions);
            } else {
                 addMessage('bot', text); // Fallback for incomplete JSON
            }
        } catch (e) {
            console.error("Failed to parse bot response JSON:", e);
            addMessage('bot', text); // Fallback for malformed JSON
        }
    };

    const handleUserInput = useCallback(async (userInput: string) => {
        if (!chatRef.current || isThinking) return;

        addMessage('user', userInput);
        setIsThinking(true);

        try {
            const responseStream = await chatRef.current.sendMessageStream({ message: userInput });
            let responseText = '';
            for await (const chunk of responseStream) {
                responseText += chunk.text;
            }
            handleBotResponse(responseText);
        } catch (error) {
            console.error("Error sending message:", error);
            addMessage('bot', 'エラーが発生しました。もう一度試してください。');
        } finally {
            setIsThinking(false);
        }
    }, [addMessage, isThinking]);
    
    return {
        messages,
        handleUserInput,
        isThinking,
        isGenerating,
    };
};
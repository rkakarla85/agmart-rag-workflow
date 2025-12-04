import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hello! I'm your agri-commodity assistant. Ask me about prices, market trends, or specific crop details." }
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'te'
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const [audioElement, setAudioElement] = useState(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            // Set language based on selection
            recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-US';

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                handleSend(transcript); // Auto-send on voice input
            };
        }
    }, [language]); // Re-initialize when language changes

    const speak = async (text) => {
        try {
            // Stop any current audio
            stopSpeaking();

            const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}`, {
                method: 'POST',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                audio.onplay = () => setIsSpeaking(true);
                audio.onended = () => setIsSpeaking(false);
                audio.onerror = () => setIsSpeaking(false);

                setAudioElement(audio);
                audio.play();
            }
        } catch (error) {
            console.error("TTS Error:", error);
            setIsSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            setIsSpeaking(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    const handleSend = async (textOverride = null) => {
        const textToSend = textOverride || query;
        if (!textToSend.trim()) return;

        // Stop speaking if user interrupts
        stopSpeaking();

        const userMessage = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:8000/query?question=${encodeURIComponent(textToSend)}&language=${language}`, {
                method: 'POST',
            });

            const data = await response.json();
            const botMessage = { role: 'bot', content: data.answer };
            setMessages(prev => [...prev, botMessage]);

            // Read out the answer using OpenAI TTS
            speak(data.answer);
        } catch (error) {
            const errorMessage = { role: 'bot', content: "Sorry, I couldn't get an answer. Please check your connection." };
            setMessages(prev => [...prev, errorMessage]);
            speak("Sorry, I couldn't get an answer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-green-100 h-[650px] flex flex-col overflow-hidden ring-1 ring-green-50">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 border-b border-green-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-white">AI Assistant</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-green-100 font-bold flex items-center gap-1">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-100"></span>
                                </span>
                                Online
                            </p>
                            {/* Language Selector */}
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-xs border border-green-300 rounded-md px-2 py-0.5 bg-white/90 text-slate-700 focus:outline-none focus:border-green-100 focus:ring-1 focus:ring-green-100 shadow-sm font-medium"
                            >
                                <option value="en">English</option>
                                <option value="te">Telugu</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1 font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            Stop Speaking
                        </button>
                    )}
                    <button
                        onClick={() => setMessages([{ role: 'bot', content: language === 'te' ? "నమస్కారం! నేను మీ వ్యవసాయ సహాయకుడిని. ధరలు లేదా పంట వివరాల గురించి నన్ను అడగండి." : "Hello! I'm your agri-commodity assistant. Ask me about prices, market trends, or specific crop details." }])}
                        className="text-xs text-green-100 hover:text-white transition-colors p-1.5 hover:bg-green-500 rounded-full"
                        title="Clear Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-none shadow-md shadow-green-100'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className={`flex gap-2 items-center bg-slate-50 border rounded-full px-4 py-2 transition-all duration-300 ${isListening
                    ? 'border-red-400 ring-4 ring-red-50'
                    : 'border-slate-200 focus-within:ring-4 focus-within:ring-green-100 focus-within:border-green-500'
                    }`}>
                    <button
                        onClick={toggleListening}
                        className={`p-2 rounded-full transition-all duration-200 ${isListening
                            ? 'text-red-500 bg-red-50 animate-pulse'
                            : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                        title="Voice Input"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? (language === 'te' ? "వినబడుతోంది..." : "Listening...") : (language === 'te' ? "ప్రశ్న అడగండి..." : "Ask a question...")}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 text-sm py-2"
                        disabled={loading}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !query.trim()}
                        className={`p-2 rounded-full transition-all duration-200 ${loading || !query.trim()
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-green-600 hover:bg-green-100 active:scale-95'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2 font-medium">
                    {isListening
                        ? (language === 'te' ? "ఇప్పుడు మాట్లాడండి..." : "Speak now...")
                        : (language === 'te' ? "మైక్ నొక్కండి లేదా టైప్ చేయండి." : "Tap the mic to speak or type your question.")}
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;

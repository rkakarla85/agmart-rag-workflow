import React, { useState } from 'react';

const ChatInterface = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMessage = { role: 'user', content: query };
        setMessages([...messages, userMessage]);
        setQuery('');
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:8001/query?question=${encodeURIComponent(query)}`, {
                method: 'POST',
            });

            const data = await response.json();
            const botMessage = { role: 'bot', content: data.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = { role: 'bot', content: "Sorry, I couldn't get an answer." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Ask about Prices</h2>

            <div className="flex-1 overflow-y-auto mb-4 border p-4 rounded bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-gray-500 text-sm">Thinking...</div>}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question (e.g., 'Max price of Tomato in Hyderabad?')"
                    className="flex-1 p-2 border rounded"
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;

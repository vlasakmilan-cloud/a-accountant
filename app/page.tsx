'use client';

import React, { useState } from 'react';
import { Calculator, Bot, User, Send, Mic } from 'lucide-react';

export default function AIAccountantApp() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: 'Dobrý den! Jsem váš AI účetní asistent.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Přihlášení
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Calculator className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-purple-600">A!Accountant</h1>
            <p className="text-gray-600 mt-2">AI účetní software</p>
          </div>
          <button
            onClick={() => setUser({ email: 'test@test.cz' })}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
          >
            Vstoupit do aplikace
          </button>
        </div>
      </div>
    );
  }

  // AI Chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: inputMessage }]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'ai', 
        content: data.message || 'Chyba při komunikaci s AI' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        type: 'ai', 
        content: 'Momentálně nemohu odpovědět. Zkuste později.' 
      }]);
    }
    setIsTyping(false);
  };

  // Hlavní aplikace
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">A!Accountant - AI Účetní</h1>
          <p className="text-gray-600">Přihlášen: {user.email}</p>
        </header>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-600" />
            AI Asistent - České účetnictví
          </h2>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message: any) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  AI píše...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Zeptejte se na české účetnictví..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

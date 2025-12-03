import React from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Agri-Commodity Intelligence</h1>
          <p className="text-gray-600">Upload your price data and ask questions instantly.</p>
        </header>

        <FileUpload />
        <ChatInterface />
      </div>
    </div>
  );
}

export default App;

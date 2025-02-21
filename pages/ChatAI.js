import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/supabaseClient';
import { generateAIResponse } from '../components/openai';
import '../styles/ChatAI.css';  // Add this line

const ChatAI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*');
      
      if (error) throw error;
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Here you would typically make a call to your AI service
      // For example, using OpenAI's API
      const response = await processAIResponse(input, documents);
      
      const aiMessage = {
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing AI response:', error);
      const errorMessage = {
        text: 'Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const processAIResponse = async (userInput, contextDocuments) => {
    try {
      const response = await generateAIResponse(userInput, contextDocuments);
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  return (
    <div className="page-container"> {/* Add this wrapper if you have global page styles */}
      <div className="chat-container">
        <div className="chat-header">
          <h1>Ask DPG AI Assistant</h1>
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                {message.text}
              </div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about our properties..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAI;

// Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import ChatbotService from './services/chatbotService';
import './Chatbot.css'; // Add your styling

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotService, setChatbotService] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize chatbot service
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey) {
      setChatbotService(new ChatbotService(apiKey));
      setMessages([{
        id: 1,
        type: 'bot',
        content: `Hello! I can help you manage your business data. You can:

📊 Query Data:
• "Show me all orders for John"
• "List products with rate above 100"
• "Show recent stock updates"

✨ Create Records:
• "Add new employee John with wage 1000"
• "Create product item Laptop with rate 999"

📝 Update Records:
• "Update order abc123 total amount to 500"
• "Change employee John's wage to 1200"

🗑️ Delete Records:
• "Delete order xyz789"
• "Remove employee record abc123"`,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatbotService || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await chatbotService.processUserRequest(inputText);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: result.response,
        timestamp: new Date(),
        queryPlan: result.queryPlan,
        resultCount: result.resultCount,
        success: result.success
      };

      // Add action-specific feedback
      if (result.queryPlan && result.success) {
        const action = result.queryPlan.action;
        if (action === 'create') {
          botMessage.content = `✅ Successfully created new ${result.queryPlan.table} record.\n\n${result.response}`;
        } else if (action === 'update') {
          botMessage.content = `✅ Successfully updated ${result.queryPlan.table} record.\n\n${result.response}`;
        } else if (action === 'delete') {
          botMessage.content = `✅ Successfully deleted ${result.queryPlan.table} record.\n\n${result.response}`;
        }
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `❌ Error: ${error.message}\n\nPlease try rephrasing your request or check the data you provided.`,
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQueries = [
    "Show me today's orders",
    "List all products",
    "Add new employee John with wage 1000",
    "Update order abc123 total to 500",
    "Show current stock levels",
    "List recent raw material purchases"
  ];

  const handleSuggestedQuery = (query) => {
    setInputText(query);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Business Data Assistant</h3>
        <div className="status-indicator">
          <span className={`status-dot ${chatbotService ? 'online' : 'offline'}`}></span>
          {chatbotService ? 'Ready' : 'Initializing...'}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <div className="message-text">
                {message.content.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
              {message.queryPlan && (
                <div className="query-info">
                  <small>
                    📊 Searched {message.queryPlan.table} • Found {message.resultCount} results
                  </small>
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-queries">
          <h4>Try asking:</h4>
          <div className="suggestions">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                className="suggestion-btn"
                onClick={() => handleSuggestedQuery(query)}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your business data..."
            rows="1"
            disabled={!chatbotService || isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || !chatbotService || isLoading}
            className="send-btn"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
import React, { useState, useEffect, useRef } from "react";
import { chatbotService } from "~/services/chatbotService";
import type { ChatMessage } from "~/services/chatbotService";

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm MediBot, your AI medical assistant. I'm here to help you with general health questions, provide advice on common ailments, and guide you through health-related concerns. How can I assist you today?",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      setIsStreaming(true);
      setStreamingMessage("");

      let fullStreamedMessage = "";

      // Use streaming for better user experience
      await chatbotService.sendMessageStreaming(userMessage, (chunk: string) => {
        fullStreamedMessage += chunk;
        setStreamingMessage(fullStreamedMessage);
      });

      // Move the complete streaming message to messages array
      setMessages(prev => [...prev, {
        role: "assistant",
        content: fullStreamedMessage,
        timestamp: new Date()
      }]);

      setStreamingMessage("");

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const clearChat = () => {
    chatbotService.clearConversation();
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm MediBot, your AI medical assistant. How can I assist you today?",
        timestamp: new Date()
      }
    ]);
    setStreamingMessage("");
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="d-flex align-items-center">
            <i className="fas fa-robot me-2" />
            <h5 className="mb-0">MediBot</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={clearChat}
              title="Clear Chat"
            >
              <i className="fas fa-trash" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
              title="Close Chat"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === "user" ? "user-message" : "bot-message"}`}
            >
              <div className="message-content">
                <div className="message-text">
                  {message.content}
                </div>
                {message.timestamp && (
                  <div className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <div className="message bot-message">
              <div className="message-content">
                <div className="message-text">
                  {streamingMessage}
                  <span className="typing-indicator">▋</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !isStreaming && (
            <div className="message bot-message">
              <div className="message-content">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Ask me about your health..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <i className="fas fa-paper-plane" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

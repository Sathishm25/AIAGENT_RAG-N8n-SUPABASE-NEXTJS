"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Trash2, Bot, User, MessageSquare, MoreVertical, Settings, Search, Book, Play, Grid, Mic, BarChart3 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const WEBHOOK_URL = 'http://localhost:5678/webhook/ab8f759e-7e19-41d6-a270-40a5b7206e06';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [webhookResponses, setWebhookResponses] = useState<{[key: string]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowChatMenu(null);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generateChatTitle = (firstMessage: string) => {
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
  };

  // Function to generate AI response based on user message
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();
    
    // Welcome/greeting messages
    if (message.includes('hi') || message.includes('hello') || message.includes('hey') || 
        message.includes('welcome') || message.includes('good morning') || message.includes('good afternoon') ||
        message.includes('good evening')) {
      return "Hi! How can I help you today?";
    }
    
    // Default response for unknown queries
    return "I am sorry I don't have the relevant data you requested. Please contact the HR team to resolve your queries.";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Create new session if none exists
    if (!currentSessionId) {
      const newSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        title: generateChatTitle(userMessage.content),
        messages: newMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
    } else {
      // Update existing session
      setChatSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: newMessages, updatedAt: new Date() }
          : session
      ));
    }

    // Send message to webhook with current session ID
    try {
      const webhookData = {
        message: input.trim(),
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId || `session_${Date.now()}`,
        source: 'chat'
      };

      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (webhookResponse.ok) {
        const responseData = await webhookResponse.json();
        // Store webhook response in state
        setWebhookResponses(prev => ({
          ...prev,
          [userMessage.id]: {content: responseData[0].output}
        }));
        
        // Add AI response from webhook
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: responseData[0].output,
          role: "assistant",
          timestamp: new Date(),
        };
        
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        
        // Update session with AI response
        if (currentSessionId) {
          setChatSessions(prev => prev.map(session => 
            session.id === currentSessionId 
              ? { ...session, messages: updatedMessages, updatedAt: new Date() }
              : session
          ));
        }
        
        console.log('Webhook response stored:', responseData);
      } else {
        console.warn('Webhook call failed:', webhookResponse.status);
        
        // Fallback to default AI response if webhook fails
        const aiResponse = generateAIResponse(input.trim());
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          role: "assistant",
          timestamp: new Date(),
        };
        
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        
        // Update session with AI response
        if (currentSessionId) {
          setChatSessions(prev => prev.map(session => 
            session.id === currentSessionId 
              ? { ...session, messages: updatedMessages, updatedAt: new Date() }
              : session
          ));
        }
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      
      // Fallback to default AI response if webhook fails
      const aiResponse = generateAIResponse(input.trim());
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      
      // Update session with AI response
      if (currentSessionId) {
        setChatSessions(prev => prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: updatedMessages, updatedAt: new Date() }
            : session
        ));
      }
    }

    setIsLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setCurrentSessionId(null);
  };

  const handleLoadChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
    }
  };

  const handleDeleteChat = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
    setShowChatMenu(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchQuery("");
    }
  };

  const filteredChatSessions = searchQuery.trim() 
    ? chatSessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : chatSessions;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 text-center">RAG AI CHATBOT</h1>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto" ref={dropdownRef}>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2 text-base font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 mb-4 cursor-pointer"
          >
            <Plus size={18} className="text-gray-600" />
            New chat
          </button>
          
          {/* Search Chats */}
          <div className="mb-4">
            <button
              onClick={handleSearch}
              className="w-full flex items-center gap-2 px-4 py-2 text-base font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <Search size={18} className="text-gray-600" />
              Search chats
            </button>
            
            {isSearching && (
              <div className="mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}
          </div>
          
          {/* Chat History */}
          {filteredChatSessions.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-gray-600 mb-2">
                Chats
              </div>
              {filteredChatSessions.map((session) => (
                <div key={session.id} className="relative group">
                  <button
                    onClick={() => handleLoadChat(session.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                      currentSessionId === session.id ? "bg-gray-200" : ""
                    }`}
                  >
                    <MessageSquare size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{session.title}</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowChatMenu(showChatMenu === session.id ? null : session.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-300 cursor-pointer text-gray-600"
                  >
                    <MoreVertical size={12} />
                  </button>
                  
                  {showChatMenu === session.id && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[120px]">
                      <button
                        onClick={() => handleDeleteChat(session.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer rounded-lg"
                      >
                        <Trash2 size={14} />
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-xs font-small">SM</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800 text-base">Sathish Mohan</div>
              </div>
              <MoreVertical size={16} />
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-20">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer rounded-lg"
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {messages.length === 0 ? (
          /* New Chat Layout - Centered */
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <Bot size={64} className="mx-auto mb-6 text-gray-600" />
              <h2 className="text-3xl font-semibold mb-4 text-gray-800">What's on the agenda today?</h2>
              <p className="text-lg text-gray-600 mb-8">Start a conversation by typing a message below.</p>
            </div>
            
              {/* Centered Input Area */}
             <div className="w-full max-w-3xl mx-auto px-4" style={{ marginBottom: '50px', marginLeft: '330px' }}>
                <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-700 bg-white"
                    rows={2}
                    style={{ minHeight: "60px", maxHeight: "150px" }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                      <Plus size={16} />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                      <BarChart3 size={16} />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                      <Mic size={16} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-3 py-2 mb-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer self-end"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Existing Chat Layout */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              <div className="max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 p-2 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-gray-800 text-white"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User size={16} />
                        ) : (
                          <Bot size={16} />
                        )}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-xl shadow-lg ${
                          message.role === "user"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 border border-gray-200 text-gray-700"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === "user" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {isLoading && (
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <div className="mx-auto" style={{ maxWidth: '940px' }}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-700 bg-white"
                      rows={2}
                      style={{ minHeight: "60px", maxHeight: "150px" }}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                        <Plus size={16} />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                        <BarChart3 size={16} />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                        <Mic size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-2 py-2 mb-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center h-[44px] w-[44px] justify-center self-end"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Trash2, Bot, User, Palette, Sun, Moon, MessageSquare, MoreVertical, Settings, Search, Book, Play, Grid } from "lucide-react";

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

type Theme = "light" | "dark" | "blue" | "green" | "purple" | "orange";

interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  hover: string;
  chatBg: string;
}

const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: "Light",
    primary: "bg-blue-500",
    secondary: "bg-gray-200",
    background: "bg-gray-50",
    surface: "bg-white",
    text: "text-gray-800",
    border: "border-gray-200",
    hover: "hover:bg-gray-100",
    chatBg: "bg-white"
  },
  dark: {
    name: "Dark",
    primary: "bg-gray-600",
    secondary: "bg-gray-700",
    background: "bg-gray-900",
    surface: "bg-gray-800",
    text: "text-gray-100",
    border: "border-gray-700",
    hover: "hover:bg-gray-700",
    chatBg: "bg-gray-800"
  },
  blue: {
    name: "Blue",
    primary: "bg-blue-500",
    secondary: "bg-blue-100",
    background: "bg-blue-50",
    surface: "bg-white",
    text: "text-blue-900",
    border: "border-blue-200",
    hover: "hover:bg-blue-100",
    chatBg: "bg-white"
  },
  green: {
    name: "Green",
    primary: "bg-green-500",
    secondary: "bg-green-100",
    background: "bg-green-50",
    surface: "bg-white",
    text: "text-green-900",
    border: "border-green-200",
    hover: "hover:bg-green-100",
    chatBg: "bg-white"
  },
  purple: {
    name: "Purple",
    primary: "bg-purple-500",
    secondary: "bg-purple-100",
    background: "bg-purple-50",
    surface: "bg-white",
    text: "text-purple-900",
    border: "border-purple-200",
    hover: "hover:bg-purple-100",
    chatBg: "bg-white"
  },
  orange: {
    name: "Orange",
    primary: "bg-orange-500",
    secondary: "bg-orange-100",
    background: "bg-orange-50",
    surface: "bg-white",
    text: "text-orange-900",
    border: "border-orange-200",
    hover: "hover:bg-orange-100",
    chatBg: "bg-white"
  }
};

const WEBHOOK_URL = 'http://localhost:5678/webhook/ab8f759e-7e19-41d6-a270-40a5b7206e06';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [webhookResponses, setWebhookResponses] = useState<{[key: string]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes[theme];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    return "I am sorry I don't have the relevant data you requested. Please contact my HR team to resolve your queries.";
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
          [userMessage.id]: {content: responseData.output}
        }));
        
        // Add AI response from webhook
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: responseData.output,
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
    setCurrentSessionId(null); // Reset session ID to create new one on next message
  };

  const handleClearSession = () => {
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
    <div className={`flex h-screen ${currentTheme.background}`}>
      {/* Sidebar */}
      <div className={`w-64 ${currentTheme.surface} border-r ${currentTheme.border} flex flex-col`}>
        <div className={`p-4 border-b ${currentTheme.border}`}>
          <h1 className={`text-xl font-bold ${currentTheme.text}`}>SatzGPT Clone</h1>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} rounded-md transition-colors mb-4`}
          >
            <Plus size={16} />
            New Chat
          </button>
          
          {/* Search Chats */}
          <div className="mb-4">
            <button
              onClick={handleSearch}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} rounded-md transition-colors`}
            >
              <Search size={16} />
              Search chats
            </button>
            
            {isSearching && (
              <div className="mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className={`w-full px-3 py-2 text-sm border ${currentTheme.border} rounded-md ${currentTheme.text} ${currentTheme.surface} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  autoFocus
                />
              </div>
            )}
          </div>
          
          {/* Chat History */}
          {filteredChatSessions.length > 0 && (
            <div className="space-y-2">
              <div className={`text-xs font-medium ${currentTheme.text} opacity-60 mb-2`}>
                Chats
              </div>
              {filteredChatSessions.map((session) => (
                <div key={session.id} className="relative group">
                  <button
                    onClick={() => handleLoadChat(session.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} rounded-md transition-colors text-left ${
                      currentSessionId === session.id ? "bg-gray-700" : ""
                    }`}
                  >
                    <MessageSquare size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{session.title}</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowChatMenu(showChatMenu === session.id ? null : session.id)}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${currentTheme.hover}`}
                  >
                    <MoreVertical size={12} />
                  </button>
                  
                  {showChatMenu === session.id && (
                    <div className={`absolute top-full right-0 mt-1 ${currentTheme.surface} border ${currentTheme.border} rounded-md shadow-lg z-20 min-w-[120px]`}>
                      <button
                        onClick={() => handleDeleteChat(session.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 ${currentTheme.hover} transition-colors`}
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
        <div className={`p-4 border-t ${currentTheme.border}`}>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} rounded-md transition-colors`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">S</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Sathish Mohan</div>
              </div>
              <MoreVertical size={16} />
            </button>
            
            {showUserMenu && (
              <div className={`absolute bottom-full left-0 right-0 mb-1 ${currentTheme.surface} border ${currentTheme.border} rounded-md shadow-lg z-20`}>
                <button
                  onClick={() => {
                    setShowThemeMenu(!showThemeMenu);
                    setShowUserMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} transition-colors`}
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Theme Menu (hidden by default, shown via Settings) */}
        {showThemeMenu && (
          <div className={`absolute bottom-20 left-4 right-4 ${currentTheme.surface} border ${currentTheme.border} rounded-md shadow-lg z-30`}>
            <div className="p-2">
              <div className={`text-xs font-medium ${currentTheme.text} opacity-60 mb-2 px-2`}>
                Theme
              </div>
              {Object.entries(themes).map(([key, themeConfig]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key as Theme);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${currentTheme.text} ${currentTheme.hover} transition-colors rounded ${
                    theme === key ? "bg-gray-700" : ""
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${themeConfig.primary}`}></div>
                  {themeConfig.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${currentTheme.chatBg}`}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center ${currentTheme.text}`}>
                <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                <p className="text-sm">Start a conversation by typing a message below.</p>
                <p className="text-xs text-blue-400 mt-2">Messages are sent to n8n webhook</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? `${currentTheme.primary} text-white`
                        : `${currentTheme.secondary} ${currentTheme.text}`
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? `${currentTheme.primary} text-white`
                        : `${currentTheme.surface} border ${currentTheme.border} ${currentTheme.text}`
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
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className={`w-8 h-8 rounded-full ${currentTheme.secondary} ${currentTheme.text} flex items-center justify-center`}>
                <Bot size={16} />
              </div>
              <div className={`px-4 py-2 rounded-lg ${currentTheme.surface} border ${currentTheme.border}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${currentTheme.border} p-4`}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything... (Messages sent to n8n webhook)"
                className={`w-full px-4 py-3 border ${currentTheme.border} rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.text} ${currentTheme.surface}`}
                rows={1}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className={`px-4 py-3 ${currentTheme.primary} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

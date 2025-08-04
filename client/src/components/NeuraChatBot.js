import React, { useState, useEffect, useRef } from "react";

function ChatBot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(prev => prev + transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };
      
      setSpeechSupported(true);
    }
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    // Add user question to messages
    const userMessage = { type: 'question', content: question, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    const currentQuestion = question;
    setQuestion(""); // Clear input immediately
    
    try {
      const response = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await response.json();
      const answerMessage = { 
        type: 'answer', 
        content: data.answer || "No answer found.", 
        id: Date.now() + 1 
      };
      setMessages(prev => [...prev, answerMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = { 
        type: 'answer', 
        content: "Something went wrong.", 
        id: Date.now() + 1 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const formatAnswer = (text) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        const lines = code.split('\n');
        const language = lines[0] && lines[0].length < 20 ? lines[0] : '';
        const codeContent = language ? lines.slice(1).join('\n') : code;

        return (
          <div key={index} className={`border rounded shadow-sm my-3 overflow-hidden ${darkMode ? 'border-secondary' : ''}`}>
            <div className={`px-3 py-2 border-bottom d-flex justify-content-between align-items-center ${
              darkMode ? 'bg-dark border-secondary' : 'bg-light border-bottom'
            }`}>
              <small className={`fw-bold ${darkMode ? 'text-light' : 'text-muted'}`}>
                {language || 'code'}
              </small>
              <button 
                className={`btn btn-sm ${darkMode ? 'btn-outline-light' : 'btn-outline-primary'}`}
                onClick={() => navigator.clipboard.writeText(codeContent)}
              >
                📋 Copy
              </button>
            </div>
            <pre className={`p-3 m-0 overflow-auto ${
              darkMode ? 'text-light bg-dark' : 'text-dark bg-white'
            }`} style={{ 
              fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", 
              fontSize: "14px", 
              lineHeight: "1.5" 
            }}>
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else {
        // Process regular text with inline code and make some text bold
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={index}>
            {inlineParts.map((inlinePart, inlineIndex) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                return (
                  <code key={inlineIndex} className={`px-2 py-1 rounded fw-bold ${
                    darkMode ? 'bg-secondary text-warning' : 'bg-light text-primary'
                  }`} style={{ 
                    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace", 
                    fontSize: "0.9em" 
                  }}>
                    {inlinePart.slice(1, -1)}
                  </code>
                );
              }
              // Make certain words bold for better readability
              return inlinePart.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            })}
          </span>
        );
      }
    });
  };

  const themeClass = darkMode ? 'bg-dark text-light' : 'bg-light text-dark';
  const cardClass = darkMode ? 'bg-dark text-light border-secondary' : 'bg-white text-dark';
  const inputClass = darkMode ? 'bg-dark text-light border-secondary' : 'bg-white text-dark';

  return (
    <>
      {/* Bootstrap CSS CDN */}
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      
      <div className={`min-vh-100 ${themeClass}`} style={{ 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
        paddingBottom: "120px",
        transition: "all 0.3s ease"
      }}>
        {/* Header */}
        <div className={`text-center py-4 shadow-sm mb-4 ${cardClass}`} style={{
          borderBottom: darkMode ? '1px solid #495057' : '1px solid #dee2e6'
        }}>
          <div className="container d-flex justify-content-between align-items-center">
            {/* New Chat Button */}
            <button 
              className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-primary'} rounded-pill`}
              onClick={() => setMessages([])}
              title="Start New Chat"
            >
              ✨ New Chat
            </button>
            
            <div>
              <h1 className={`display-5 mb-3 fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>
                🤖 Neura
              </h1>
              <p className={`lead ${darkMode ? 'text-light' : 'text-muted'}`}>
                Ask me anything! I can help with coding, explanations, and more.
              </p>
            </div>
            
            {/* Theme Toggle Button */}
            <button 
              className={`btn ${darkMode ? 'btn-outline-light' : 'btn-outline-dark'} rounded-pill`}
              onClick={toggleDarkMode}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="container" style={{ maxWidth: "800px" }}>
          {messages.length === 0 && (
            <div className="text-center py-5">
              <div className={darkMode ? 'text-light' : 'text-muted'}>
                <h4>👋 Hello! How can I help you today?</h4>
                <p>Start by asking a question below or use voice input...</p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              {message.type === 'question' ? (
                <div className="d-flex justify-content-end">
                  <div className={`rounded-3 px-4 py-3 shadow-sm ${
                    darkMode ? 'bg-primary' : 'bg-primary'
                  } text-white`} style={{ maxWidth: "70%" }}>
                    <div className="fw-semibold mb-1">You asked:</div>
                    <div>{message.content}</div>
                  </div>
                </div>
              ) : (
                <div className="d-flex justify-content-start">
                  <div style={{ maxWidth: "85%" }}>
                    <div className="d-flex align-items-center mb-2">
                      <span className="me-2 fs-5">🤖</span>
                      <span className={`fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>
                        Neura:
                      </span>
                    </div>
                    <div className={`lh-lg ${darkMode ? 'text-light' : 'text-dark'}`} style={{ 
                      whiteSpace: "pre-wrap", 
                      wordBreak: "break-word",
                      fontSize: "1.05rem"
                    }}>
                      {formatAnswer(message.content)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="d-flex justify-content-start mb-4">
              <div style={{ maxWidth: "85%" }}>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-2 fs-5">🤖</span>
                  <span className={`fw-bold ${darkMode ? 'text-info' : 'text-primary'}`}>
                    Neura:
                  </span>
                </div>
                <div className={darkMode ? 'text-light' : 'text-muted'}>
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Thinking...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Input Section at Bottom */}
        <div className={`fixed-bottom border-top shadow-lg ${cardClass}`} style={{
          borderTopColor: darkMode ? '#495057' : '#dee2e6'
        }}>
          <div className="container py-3" style={{ maxWidth: "800px" }}>
            <div className="row g-2 align-items-end">
              <div className="col">
                <textarea
                  className={`form-control border-2 ${inputClass}`}
                  style={{ 
                    minHeight: "50px", 
                    maxHeight: "120px", 
                    resize: "none",
                    fontSize: "16px",
                    lineHeight: "1.4",
                    backgroundColor: darkMode ? '#212529' : '#ffffff',
                    borderColor: darkMode ? '#495057' : '#ced4da',
                    color: darkMode ? '#ffffff' : '#000000'
                  }}
                  placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  rows="1"
                />
              </div>
              
              {/* Voice Recording Button */}
              {speechSupported && (
                <div className="col-auto">
                  <button 
                    className={`btn px-3 py-2 fw-semibold ${
                      isRecording 
                        ? 'btn-danger' 
                        : darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
                    }`}
                    onClick={toggleRecording}
                    disabled={loading}
                    style={{ height: "50px", minWidth: "50px" }}
                    title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                  >
                    {isRecording ? (
                      <>
                        {isListening && (
                          <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                        )}
                        🔴
                      </>
                    ) : (
                      '🎤'
                    )}
                  </button>
                </div>
              )}
              
              <div className="col-auto">
                <button 
                  className={`btn btn-primary px-4 py-2 fw-semibold ${(loading || !question.trim()) ? 'disabled' : ''}`}
                  onClick={handleAsk} 
                  disabled={loading || !question.trim()}
                  style={{ 
                    height: "50px",
                    minWidth: "100px"
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-1" role="status"></div>
                      Sending...
                    </>
                  ) : (
                    "Send ➤"
                  )}
                </button>
              </div>
            </div>
            
            <div className="text-center mt-2 d-flex justify-content-between align-items-center">
              <small className={darkMode ? 'text-light' : 'text-muted'}>
                {question.length} characters
              </small>
              {isRecording && (
                <small className="text-danger fw-bold">
                  🔴 Recording... Speak now
                </small>
              )}
              {speechSupported && !isRecording && (
                <small className={darkMode ? 'text-light' : 'text-muted'}>
                  Click 🎤 for voice input
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatBot;
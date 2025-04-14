import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  attachments?: {
    name: string;
    type: string;
    url: string;
  }[];
}

interface PatientSummary {
  name: string;
  age: number;
  history: string[];
  currentSymptoms: string[];
  medications: string[];
}

export default function DrChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm MediSmart, Your AI Assistant. I can help you analyze patient records, summarize medical histories, and provide predictive diagnosis suggestions. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
      status: 'sent'
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sample patient data - in a real app, this would come from your backend
  const samplePatient: PatientSummary = {
    name: "John Doe",
    age: 45,
    history: [
      "Type 2 Diabetes diagnosed in 2020",
      "Hypertension",
      "Previous knee surgery in 2019"
    ],
    currentSymptoms: [
      "Persistent cough",
      "Mild fever",
      "Fatigue"
    ],
    medications: [
      "Metformin 500mg",
      "Lisinopril 10mg"
    ]
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) { // 10MB limit
        alert("Total file size exceeds 10MB limit");
        return;
      }
      setSelectedFiles(Array.from(files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;

    // Create attachments array from selected files
    const attachments = selectedFiles.map(file => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Simulate AI thinking
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user message status to sent
    setMessages(prev => 
      prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' as const } : msg
      )
    );

    // Simulate AI response based on user input
    let aiResponse = "I'll analyze the information provided.";
    
    if (attachments.length > 0) {
      aiResponse = "I've received your attachments. Let me analyze them:\n\n" +
        attachments.map(att => `• ${att.name}: ${
          att.type.includes('image') 
            ? 'Image analysis in progress...' 
            : 'Document analysis in progress...'
        }`).join('\n');
    } else if (inputMessage.toLowerCase().includes('summary')) {
      aiResponse = `Here's a summary of ${samplePatient.name}'s case:\n\n` +
        `Age: ${samplePatient.age}\n` +
        `Medical History:\n${samplePatient.history.map(h => `• ${h}`).join('\n')}\n\n` +
        `Current Symptoms:\n${samplePatient.currentSymptoms.map(s => `• ${s}`).join('\n')}\n\n` +
        `Current Medications:\n${samplePatient.medications.map(m => `• ${m}`).join('\n')}`;
    } else if (inputMessage.toLowerCase().includes('diagnosis')) {
      aiResponse = "Based on the current symptoms and medical history, here are potential conditions to consider:\n\n" +
        "1. Upper Respiratory Infection (Most likely)\n" +
        "• Matches symptoms: cough, fever, fatigue\n" +
        "• Consider patient's diabetic status\n\n" +
        "2. COVID-19 (Should be ruled out)\n" +
        "• Recommend testing due to symptom overlap\n\n" +
        "3. Bronchitis\n" +
        "• Consider due to persistent cough\n\n" +
        "Recommended Actions:\n" +
        "• Conduct COVID-19 test\n" +
        "• Monitor blood sugar levels\n" +
        "• Check for any medication interactions";
    }

    // Simulate AI typing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTyping(false);

    const aiMessage: Message = {
      id: messages.length + 2,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <div className="d-flex flex-column" style={{ height: "75vh" }}>
            {/* Chat Header */}
            <div className="border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle p-2 me-2">
                  <i className="fas fa-robot text-white" />
                </div>
                <div>
                  <h4 className="mb-0">Medismart Assistant</h4>
                  <p className="text-muted mb-0 small">
                    {isTyping ? (
                      <span className="text-primary">
                        <i className="fas fa-circle-notch fa-spin me-2" />
                        Analyzing...
                      </span>
                    ) : "Ready to assist you"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-grow-1 overflow-auto mb-3 px-2" 
              style={{
                maxHeight: "calc(75vh - 180px)"
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`d-flex ${
                    message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'
                  } mb-3`}
                >
                  {message.sender === 'ai' && (
                    <div className="me-2">
                      <div className="bg-primary rounded-circle p-2">
                        <i className="fas fa-robot text-white" style={{ width: '16px', height: '16px' }} />
                      </div>
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-3 shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-primary bg-gradient text-white'
                        : 'bg-light'
                    }`}
                    style={{ 
                      maxWidth: '75%',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={`small ${message.sender === 'user' ? 'text-white-50' : 'text-muted'}`}>
                        {message.sender === 'user' ? 'You' : 'Medismart Assistant'}
                      </span>
                      <span className={`small ms-2 ${message.sender === 'user' ? 'text-white-50' : 'text-muted'}`}>
                        {format(message.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <div>{message.content}</div>
                    {message.attachments && (
                      <div className="mt-2 border-top pt-2">
                        {message.attachments.map((att, index) => (
                          <div key={index} className="d-flex align-items-center mt-1">
                            <i className={`fas ${
                              att.type.includes('image') ? 'fa-image' : 'fa-file-medical'
                            } me-2`} />
                            <a 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`${message.sender === 'user' ? 'text-white' : 'text-primary'} text-decoration-none`}
                            >
                              {att.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="text-end mt-1">
                        <small className="text-white-50">
                          {message.status === 'sending' && <i className="fas fa-clock" />}
                          {message.status === 'sent' && <i className="fas fa-check" />}
                          {message.status === 'error' && <i className="fas fa-exclamation-circle" />}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="d-flex align-items-center mb-3">
                  <div className="me-2">
                    <div className="bg-primary rounded-circle p-2">
                      <i className="fas fa-robot text-white" style={{ width: '16px', height: '16px' }} />
                    </div>
                  </div>
                  <div className="bg-light p-3 rounded-3 shadow-sm">
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

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="border rounded p-2 mb-3 bg-light">
                <div className="d-flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="d-flex align-items-center bg-white rounded px-2 py-1 shadow-sm">
                      <i className={`fas ${
                        file.type.includes('image') ? 'fa-image' : 'fa-file-medical'
                      } me-2 text-primary`} />
                      <span className="me-2 small">{file.name}</span>
                      <button 
                        className="btn btn-link btn-sm p-0 text-danger"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="mt-auto border-top pt-3">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary px-3 d-flex align-items-center"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files (max 10MB)"
                >
                  <i className="fas fa-paperclip" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  multiple
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="flex-grow-1 position-relative">
                  <input
                    type="text"
                    className="form-control pe-5"
                    placeholder="Ask about patient history, symptoms, or potential diagnosis..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary position-absolute end-0 top-0 bottom-0 px-3"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() && selectedFiles.length === 0}
                  >
                    <i className="fas fa-paper-plane" />
                  </button>
                </div>
              </div>
              <div className="text-muted small mt-2">
                <i className="fas fa-lightbulb me-1"></i>
                Try asking: "Give me a summary of John's history" or "Suggest possible diagnosis"
              </div>
            </div>
          </div>
        </DashboardContainer>
      </div>
    </div>
  );
}

// Add this CSS to your global styles
/*
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #6c757d;
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
*/

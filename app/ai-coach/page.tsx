import ChatInterface from '../../components/ai-chat/ChatInterface';

export default function AiCoachPage() {
  return (
    <div className="content-section active">
      <div className="chat-layout">
        <div className="ai-chat-container">
          <div className="chat-header">
            <div className="ai-avatar">🤖</div>
            <div className="ai-info">
              <h3>Dr. Anna - Your AI Health Coach</h3>
              <div className="ai-status">
                <div className="status-dot"></div>
                Online • Ready to help with your health journey
              </div>
            </div>
          </div>
          {/* Real AI Health Coach chat interface */}
          <div style={{ padding: '1rem 0' }}>
            <ChatInterface />
          </div>
          <div className="chat-input-container">
            <div className="quick-prompts">
              <div className="quick-prompt">💊 Ask about my medications</div>
              <div className="quick-prompt">📊 Show me my inflammation markers</div>
              <div className="quick-prompt">🧬 Explain my genetic variants</div>
              <div className="quick-prompt">😴 Why am I still tired?</div>
            </div>
            <div className="chat-input">
              <div className="input-wrapper">
                <textarea placeholder="Ask Dr. Anna about your health patterns, test results, or get personalized recommendations..." rows={1}></textarea>
                <button className="voice-btn" title="Voice input">🎤</button>
              </div>
              <button className="send-btn">
                <span>Send</span>
                <span>💬</span>
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="sidebar-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "white" }}>🎯</div>
              <div className="card-title">Active Topics</div>
            </div>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#64748b" }}>
              • B12 deficiency & MTHFR variant<br />
              • Afternoon energy crashes<br />
              • Microbiome optimization<br />
              • Supplement recommendations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

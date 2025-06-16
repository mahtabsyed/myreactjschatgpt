import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';
const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'o3', name: 'GPT-o3' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

export default function App() {
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content: string}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [method, setMethod] = useState(null); // simple | reasoning | internet_search
  const messagesEndRef = useRef(null);

  const classifyPrompt = async (prompt) => {
    const messages = [
      {
        role: 'system',
        content:
          'You are a classification assistant. Respond ONLY with JSON like {"type":"simple"}. Types: simple, reasoning, internet_search.',
      },
      { role: 'user', content: prompt },
    ];
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'gpt-4o', messages, temperature: 0 }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    try {
      const obj = JSON.parse(content);
      return obj.type;
    } catch {
      return 'simple';
    }
  };

  const googleSearch = async (query) => {
    const params = new URLSearchParams({
      key: process.env.REACT_APP_GOOGLE_API_KEY,
      cx: process.env.REACT_APP_GOOGLE_CSE_ID,
      q: query,
      num: '3',
    });
    const res = await fetch(`${GOOGLE_SEARCH_URL}?${params.toString()}`);
    const data = await res.json();
    return (
      data.items?.map((item) => `${item.title}\n${item.link}\n${item.snippet}`) || []
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setError(null);
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const kind = await classifyPrompt(input);
      setMethod(kind);
      const baseSystem = {
        role: 'system',
        content:
          'Please format your responses using Markdown syntax for better readability. Use:\n- Paragraphs with line breaks\n- Bullet points for lists\n- Headers for sections\n- Code blocks when sharing code\n- Bold or italic for emphasis',
      };
      let model = 'gpt-4o-mini';
      let body;
      if (kind === 'simple') {
        model = 'gpt-4o-mini';
        body = { model, messages: [baseSystem, ...newMessages] };
      } else if (kind === 'reasoning') {
        model = 'o4-mini';
        body = { model, messages: [baseSystem, ...newMessages] };
      } else {
        model = 'gpt-4o';
        const results = await googleSearch(input);
        const formatted = results.join('\n\n');
        body = {
          model,
          messages: [
            { role: 'system', content: 'Use the following Google search results to answer the question.' },
            { role: 'user', content: `Search results:\n${formatted}\n\nQuestion: ${input}` },
          ],
        };
      }
      setSelectedModel(model);

      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        // Construct detailed error message
        const errorMessage = `API Error (${res.status}): ${errorData.error?.message || 'Unknown error'}\n\nError Type: ${errorData.error?.type || 'Unknown'}\n\nError Code: ${errorData.error?.code || 'No code'}`;
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('API Response:', data);
      const aiMessage = data.choices?.[0]?.message?.content || 'No response';
      setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="gpt4o-root">
      <main className="gpt4o-main">
        <div className="gpt4o-model-selector">
          <label htmlFor="model-select">Model: </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={loading}
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
        {messages.length === 0 && (
          <>
            <h1 className="gpt4o-app-title">my ReactJS ChatGPT</h1>
            <h1 className="gpt4o-title">What can I help with?</h1>
          </>
        )}
        <div className="gpt4o-chat-area">
          {messages.length === 0 && (
            <div className="gpt4o-chat-placeholder">Your conversation will appear here.</div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`gpt4o-msg gpt4o-msg-${msg.role}`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="gpt4o-input-box" onSubmit={handleSend}>
          <input
            className="gpt4o-input"
            placeholder="Ask anything"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button className="gpt4o-send-btn" title="Send" disabled={!input.trim() || loading} type="submit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <div className="gpt4o-model-indicator">Using model: {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}{method ? ` – ${method}` : ''}</div>
        </form>
        {loading && <div className="gpt4o-loading">Thinking…</div>}
        {error && <div className="gpt4o-error">{error}</div>}
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import { agent } from '../utils/api';

export default function Agent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [quickInsights, setQuickInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAgentStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAgentStatus = async () => {
    try {
      const status = await agent.getStatus();
      setAgentStatus(status);
    } catch (error) {
      console.error('Failed to check agent status:', error);
      setAgentStatus({ status: 'error', message: 'Failed to connect to AI agent' });
    }
  };

  const loadQuickInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await agent.getInsights();
      setQuickInsights(response);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await agent.chat(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (analysisType) => {
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `Analyze: ${analysisType}` },
    ]);

    try {
      const response = await agent.analyze(analysisType);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.analysis },
      ]);
    } catch (error) {
      console.error('Failed to perform analysis:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error performing the analysis. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { type: 'performance', label: 'Performance Overview', icon: Sparkles },
    { type: 'brands', label: 'Brand Analysis', icon: Sparkles },
    { type: 'forecast', label: 'Revenue Forecast', icon: Sparkles },
    { type: 'opportunities', label: 'Growth Opportunities', icon: Sparkles },
    { type: 'risks', label: 'Risk Assessment', icon: Sparkles },
  ];

  const suggestedQuestions = [
    'How are we pacing against our monthly revenue targets?',
    'Which brands are underperforming and need attention?',
    'What are the top 5 revenue-generating brands this month?',
    'Compare performance across platform categories',
    'What recommendations do you have for improving revenue?',
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-600" />
              AI Business Assistant
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Get intelligent insights and analysis powered by Claude AI
            </p>
          </div>
          {agentStatus && (
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                agentStatus.status === 'configured'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {agentStatus.status === 'configured' ? 'AI Ready' : 'Configuration Required'}
            </div>
          )}
        </div>

        {/* Status Alert */}
        {agentStatus && agentStatus.status !== 'configured' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">AI Agent Not Configured</p>
              <p className="text-sm text-yellow-700 mt-1">{agentStatus.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Start a Conversation
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-md">
                      Ask me about revenue performance, brand analytics, pacing metrics, or any business intelligence questions.
                    </p>
                    <div className="mt-6 space-y-2 w-full max-w-md">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Try asking:
                      </p>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(question)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing data...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about revenue, brands, or business performance..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || agentStatus?.status !== 'configured'}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim() || agentStatus?.status !== 'configured'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Analysis</h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.type}
                      onClick={() => handleQuickAction(action.type)}
                      disabled={loading || agentStatus?.status !== 'configured'}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon className="w-4 h-4 text-blue-600" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
                <button
                  onClick={loadQuickInsights}
                  disabled={insightsLoading || agentStatus?.status !== 'configured'}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
              {quickInsights ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {quickInsights.insights}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Click refresh to generate AI-powered insights about your business performance.
                </p>
              )}
            </div>

            {/* Capabilities */}
            {agentStatus?.capabilities && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Agent Capabilities</h3>
                <ul className="space-y-2">
                  {agentStatus.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">&#10003;</span>
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

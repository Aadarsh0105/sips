import { useEffect, useRef, useState } from 'react';
import { BotIcon, MessageCircleIcon, SendIcon, XIcon } from 'lucide-react';
import chatbotData from '../../data/studentChatbot.json';

type Message = { id: number; role: 'bot' | 'user'; text: string };

export function StudentChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: chatbotData.welcome },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const ask = (question: string) => {
    const value = question.trim();
    if (!value) return;
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normalized = normalize(value);
    const matched = chatbotData.entries
      .map((entry) => {
        const exactQuestion = normalize(entry.question) === normalized;
        const keywordScore = entry.keywords.filter((keyword) =>
          normalize(keyword).split(' ').every((word) => normalized.includes(word))
        ).length;
        return { entry, score: exactQuestion ? 100 : keywordScore };
      })
      .sort((first, second) => second.score - first.score)[0];
    const answer = matched?.score ? matched.entry.answer : chatbotData.fallback;
    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: timestamp, role: 'user', text: value },
      { id: timestamp + 1, role: 'bot', text: answer },
    ]);
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 flex h-[min(560px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><BotIcon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-display text-sm font-bold">Student Help Assistant</p><p className="text-xs text-brand-100">Quick answers about fees and payments</p></div>
            <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><XIcon className="h-5 w-5" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.text}</p>
              </div>
            ))}
            <div className="pt-1">
              <p className="mb-2 text-xs font-semibold text-slate-400">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {chatbotData.suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-500/30 dark:bg-slate-800 dark:text-brand-300">{suggestion}</button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); ask(input); }} className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about fees or payments..." className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="submit" aria-label="Send message" disabled={!input.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"><SendIcon className="h-4 w-4" /></button>
          </form>
        </div>
      ) : null}

      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition hover:scale-105 hover:bg-brand-700" aria-label="Open student help assistant">
        {open ? <XIcon className="h-6 w-6" /> : <MessageCircleIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}

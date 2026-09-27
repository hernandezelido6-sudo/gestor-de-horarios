
import React, { useState } from 'react';
import { Send, Users, Shield, MessageSquare, UserPlus } from 'lucide-react';
import { Message, User, TeacherAvailability } from '../types';

interface CommunityProps {
  themeColor: string;
  isDarkMode: boolean;
  currentUser: User | null;
  teachers: TeacherAvailability[];
  messages: Message[];
  onSendMessage: (content: string) => void;
}

const getVibrantColor = (color: string) => {
  switch (color) {
    case 'blue': return 'sky-500';
    case 'red': return 'rose-500';
    case 'green': return 'emerald-500';
    case 'orange': return 'orange-500';
    case 'yellow': return 'amber-500';
    case 'teal': return 'teal-500';
    case 'indigo': return 'indigo-500';
    case 'violet': return 'violet-500';
    case 'pink': return 'pink-500';
    case 'wine': return 'rose-900';
    case 'slate': return 'slate-600';
    case 'lime': return 'lime-500';
    default: return 'fuchsia-600';
  }
};

export const Community: React.FC<CommunityProps> = ({ themeColor, isDarkMode, currentUser, teachers, messages, onSendMessage }) => {
  const vibrant = getVibrantColor(themeColor);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || !currentUser) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Comunidad Docente</h2>
          <p className="text-gray-500">Coordina con tus colegas y resuelve conflictos de horarios.</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        <div className="hidden lg:block space-y-4 overflow-y-auto pr-2">
          <div className={`border rounded-3xl p-5 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Users size={16} className={`text-${vibrant}`} />
              Profesores Registrados ({teachers.length})
            </h3>
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div key={teacher.id} className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-sm">
                    <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>{teacher.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{teacher.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`lg:col-span-3 flex flex-col border rounded-3xl overflow-hidden relative transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`p-4 border-b flex items-center space-x-3 transition-colors ${isDarkMode ? 'bg-gray-800/50 border-gray-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
            <div className={`p-2 rounded-lg bg-${vibrant} text-white`}>
              <Shield size={18} />
            </div>
            <h4 className="font-bold">Tablero Institucional</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isMe = msg.sender === currentUser?.name;
              const displaySender = isMe ? `TÚ (${msg.sender.split(' ')[0].toUpperCase()})` : msg.sender;
              const date = new Date(msg.timestamp);

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-black tracking-tighter uppercase ${msg.isOfficial ? 'text-fuchsia-500' : 'text-gray-500'}`}>
                      {displaySender}
                    </span>
                    {msg.isOfficial && <Shield size={10} className="text-fuchsia-500" />}
                  </div>
                  <div className={`max-w-lg p-4 rounded-2xl ${
                    isMe 
                      ? `bg-${vibrant} text-white rounded-tr-none shadow-md` 
                      : `${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-slate-100 text-slate-800 border-slate-200'} rounded-tl-none border shadow-sm`
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={`p-6 border-t transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje para coordinar..."
                className={`w-full border-2 rounded-2xl px-6 py-4 pr-16 focus:outline-none transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-fuchsia-600' : 'bg-white border-slate-200 text-slate-900 focus:border-sky-500 shadow-inner'}`}
              />
              <button 
                onClick={handleSend}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-${vibrant} text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-${themeColor}-900/40`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

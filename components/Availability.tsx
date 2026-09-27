
import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  FileText, 
  AlertTriangle,
  Send,
  Loader2
} from 'lucide-react';
import { User, Language } from '../types';

interface AvailabilityProps {
  themeColor: string;
  isDarkMode: boolean;
  onSave?: (slots: string[]) => void;
  currentUser: User | null;
  hours: string[];
  recesses?: string[];
  language?: Language;
}

const translations = {
  es: {
    title: 'Mi Disponibilidad',
    subtitle: 'Marca tus horas libres para el nuevo ciclo escolar.',
    sendButton: 'ENVIAR DISPONIBILIDAD',
    processing: 'PROCESANDO...',
    accepted: '¡ACEPTADO!',
    teacherDefault: 'Docente',
    subjectDefault: 'Materia no definida',
    stepsTitle: 'Pasos a Seguir',
    step1Title: 'Seleccionar Horas',
    step1Desc: 'Marca los espacios en el calendario.',
    step2Title: 'Confirmar Envío',
    step2Desc: 'Presiona el botón superior para registrar tu horario.',
    alertWarning: 'Al enviar, tu perfil se actualizará automáticamente en el sistema central.',
    selectAlert: 'Por favor, selecciona al menos un horario disponible.',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  },
  en: {
    title: 'My Availability',
    subtitle: 'Mark your free hours for the new school year.',
    sendButton: 'SUBMIT AVAILABILITY',
    processing: 'PROCESSING...',
    accepted: 'ACCEPTED!',
    teacherDefault: 'Teacher',
    subjectDefault: 'Undefined Subject',
    stepsTitle: 'Next Steps',
    step1Title: 'Select Hours',
    step1Desc: 'Mark spaces on the calendar grid.',
    step2Title: 'Confirm Submission',
    step2Desc: 'Press the submit button above to register your hours.',
    alertWarning: 'Upon submission, your profile will update automatically in the central system.',
    selectAlert: 'Please select at least one available hour slot.',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
};

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

export const Availability: React.FC<AvailabilityProps> = ({ themeColor, isDarkMode, onSave, currentUser, hours, recesses = [], language = 'es' }) => {
  const t = translations[language];
  const dbDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const days = t.days;
  const vibrant = getVibrantColor(themeColor);

  const [availableSlots, setAvailableSlots] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const toggleSlot = (day: string, hour: string) => {
    const key = `${day}-${hour}`;
    const next = new Set(availableSlots);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setAvailableSlots(next);
  };

  const handleSendAvailability = () => {
    if (availableSlots.size === 0) {
      alert(t.selectAlert);
      return;
    }
    
    setStatus('sending');

    // Simulamos la animación de procesamiento y aceptación
    setTimeout(() => {
      setStatus('success');
      
      // Esperamos un momento para mostrar el estado de éxito antes de navegar
      setTimeout(() => {
        if (onSave) {
          onSave(Array.from(availableSlots));
        }
      }, 800);
    }, 600);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.title}</h2>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        
        <button 
          onClick={handleSendAvailability}
          disabled={status !== 'idle'}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black shadow-xl transition-all uppercase tracking-widest text-sm
            ${status === 'idle' ? `bg-${vibrant} text-white hover:scale-105 active:scale-95 shadow-${themeColor}-900/40` : ''}
            ${status === 'sending' ? `bg-gray-500 text-white cursor-wait` : ''}
            ${status === 'success' ? `bg-emerald-500 text-white scale-110 shadow-emerald-900/40` : ''}
          `}
        >
          {status === 'idle' && (
            <>
              <Send size={18} />
              {t.sendButton}
            </>
          )}
          {status === 'sending' && (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t.processing}
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 size={18} className="animate-bounce" />
              {t.accepted}
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className={`border rounded-3xl p-8 flex items-center space-x-6 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              {currentUser ? getInitials(currentUser.name) : '??'}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name || t.teacherDefault}</h3>
              <p className="text-gray-500 font-medium">{currentUser?.subject || t.subjectDefault}</p>
            </div>
          </div>

          <div className={`border rounded-3xl p-6 transition-colors overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px] lg:min-w-full">
                <table className="w-full border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="p-2 w-16"></th>
                      {days.map(d => (
                        <th key={d} className={`p-2 text-[10px] font-black uppercase tracking-widest text-gray-500`}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map(hour => {
                      const isRecess = recesses.includes(hour);
                      if (isRecess) {
                        return (
                          <tr key={hour}>
                            <td className="p-2 text-[10px] font-bold text-amber-500 text-right">{hour}</td>
                            <td 
                              colSpan={days.length} 
                              className={`p-3 text-center rounded-2xl font-black tracking-widest text-[9px] uppercase border border-dashed transition-all ${
                                isDarkMode ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' : 'bg-amber-50/50 text-amber-600 border-amber-500/20'
                              }`}
                            >
                              ☕ RECREO / RECESO ESCOLAR
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={hour}>
                          <td className="p-2 text-[10px] font-bold text-gray-500 text-right">{hour}</td>
                        {dbDays.map(day => {
                          const isActive = availableSlots.has(`${day}-${hour}`);
                          return (
                            <td 
                              key={`${day}-${hour}`}
                              onClick={() => status === 'idle' && toggleSlot(day, hour)}
                              className={`h-14 w-24 rounded-xl cursor-pointer transition-all border-2 ${
                                isActive 
                                  ? `bg-${vibrant} shadow-lg shadow-${themeColor}-900/40 border-${vibrant}` 
                                  : `${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'}`
                              } ${status !== 'idle' ? 'pointer-events-none opacity-80' : ''}`}
                            >
                              <div className="flex items-center justify-center w-full h-full">
                                {isActive ? (
                                  <CheckCircle2 size={18} className="text-white animate-in zoom-in" />
                                ) : (
                                  <Plus size={14} className="text-gray-500/10" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`border rounded-3xl p-8 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`p-3 rounded-2xl bg-${vibrant}/10 text-${vibrant} inline-block mb-6`}>
              <FileText size={28} />
            </div>
            <h4 className={`text-xl font-black mb-6 uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.stepsTitle}</h4>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`w-8 h-8 shrink-0 rounded-full bg-${vibrant} text-white flex items-center justify-center font-bold text-xs`}>1</div>
                <div>
                  <h5 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.step1Title}</h5>
                  <p className="text-[11px] text-gray-500 mt-1">{t.step1Desc}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={`w-8 h-8 shrink-0 rounded-full bg-${vibrant} text-white flex items-center justify-center font-bold text-xs`}>2</div>
                <div>
                  <h5 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.step2Title}</h5>
                  <p className="text-[11px] text-gray-500 mt-1">{t.step2Desc}</p>
                </div>
              </div>
            </div>

            <div className={`mt-10 p-5 rounded-2xl flex items-start gap-4 border-2 border-dashed ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
              <AlertTriangle size={20} className="text-amber-500 shrink-0" />
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                {t.alertWarning}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  Palette, 
  Moon, 
  Sun, 
  User, 
  Shield, 
  Bell, 
  Check,
  Languages,
  ShieldAlert,
  X,
  Trash2,
  Save,
  Plus,
  Clock,
  Pencil,
  Type,
  Database,
  Server,
  RefreshCw,
  Coffee
} from 'lucide-react';
import { AppState, Language, Sector } from '../types';
import { databaseService } from '../databaseService';

interface SettingsProps {
  appState: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
  onClearSectorClasses?: () => void;
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

const translations = {
  es: {
    title: 'Ajustes',
    subtitle: 'Personalización para administradores y soporte.',
    apariencia: 'Apariencia',
    modoPantalla: 'Modo de Pantalla',
    modoPantallaDesc: 'Cambia entre tema oscuro y claro.',
    colorInst: 'Color de Interfaz (Saturado)',
    idioma: 'Idioma / Language',
    idiomaDesc: 'Selecciona el idioma del sistema.',
    tamanoLetra: 'Tamaño de Letra',
    tamanoLetraDesc: 'Ajusta el tamaño del texto para que sea más pequeño, normal o más grande.',
    letraPequena: 'Pequeña',
    letraNormal: 'Normal',
    letraGrande: 'Grande',
    sesionAdm: 'Cuenta Administrativa',
    editarPerfil: 'Ajustes de Perfil',
    preferencias: 'Preferencias del Sistema',
    soporteMsg: 'Esta cuenta está vinculada a reportes de errores.'
  },
  en: {
    title: 'Settings',
    subtitle: 'Personalization for admins and support.',
    apariencia: 'Appearance',
    modoPantalla: 'Screen Mode',
    modoPantallaDesc: 'Toggle between dark and light themes.',
    colorInst: 'Interface Color (Saturated)',
    idioma: 'Language',
    idiomaDesc: 'Select system language.',
    tamanoLetra: 'Font Size',
    tamanoLetraDesc: 'Adjust the text size to be smaller, normal, or larger.',
    letraPequena: 'Small',
    letraNormal: 'Normal',
    letraGrande: 'Large',
    sesionAdm: 'Administrative Account',
    editarPerfil: 'Profile Settings',
    preferencias: 'System Preferences',
    soporteMsg: 'This account is linked to error reporting.'
  }
};

export const Settings: React.FC<SettingsProps> = ({ appState, onUpdate, onClearSectorClasses }) => {
  const { isDarkMode, themeColor, language, currentUser } = appState;
  const vibrant = getVibrantColor(themeColor);
  const t = translations[language];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubjects, setEditSubjects] = useState<string[]>(['']);
  
  const [editorSector, setEditorSector] = useState<Sector>(appState.sector);

  const getInitialHoursForSector = (s: Sector) => {
    if (s === Sector.PREPARATORY) {
       return appState.settings?.hoursPreparatory?.length ? appState.settings.hoursPreparatory : appState.settings?.hours || ['7:00 - 8:00'];
    } else {
       return appState.settings?.hoursSecondary?.length ? appState.settings.hoursSecondary : appState.settings?.hours || ['7:00 - 8:00'];
    }
  };

  const getInitialRecessesForSector = (s: Sector) => {
    if (s === Sector.PREPARATORY) {
       return appState.settings?.recessesPreparatory || appState.settings?.recesses || [];
    } else {
       return appState.settings?.recessesSecondary || appState.settings?.recesses || [];
    }
  };

  const [editHours, setEditHours] = useState<string[]>(getInitialHoursForSector(editorSector));
  const [editingHourIndex, setEditingHourIndex] = useState<number | null>(null);
  const [editRecesses, setEditRecesses] = useState<string[]>(getInitialRecessesForSector(editorSector));

  React.useEffect(() => {
    if (appState.settings) {
      setEditHours(getInitialHoursForSector(editorSector));
      setEditRecesses(getInitialRecessesForSector(editorSector));
    }
  }, [appState.settings, editorSector]);

  const handleHourChange = (index: number, value: string) => {
    const oldVal = editHours[index];
    const newHours = [...editHours];
    newHours[index] = value;
    setEditHours(newHours);
    
    // Update recess map index value if was selected
    if (oldVal && editRecesses.includes(oldVal)) {
      setEditRecesses(prev => prev.map(r => r === oldVal ? value : r));
    }
  };
  
  const handleSaveHours = () => {
    const filteredHours = editHours.filter(h => h.trim() !== '' && h.trim() !== '-');
    const filteredRecesses = editRecesses.filter(r => filteredHours.includes(r));
    onUpdate({ 
      settings: { 
        ...appState.settings, 
        ...(editorSector === Sector.PREPARATORY 
             ? { hoursPreparatory: filteredHours, recessesPreparatory: filteredRecesses }
             : { hoursSecondary: filteredHours, recessesSecondary: filteredRecesses })
      } 
    });
    setEditingHourIndex(null);
  };

  const toggleRecess = (hour: string) => {
    if (!hour) return;
    setEditRecesses(prev => 
      prev.includes(hour) 
        ? prev.filter(r => r !== hour) 
        : [...prev, hour]
    );
  };

  const addHour = () => {
    setEditHours([...editHours, '']);
    setEditingHourIndex(editHours.length);
  };
  const removeHour = (index: number) => {
    const deletedHour = editHours[index];
    setEditHours(editHours.filter((_, i) => i !== index));
    if (deletedHour) {
      setEditRecesses(prev => prev.filter(r => r !== deletedHour));
    }
  };

  const openEditModal = () => {
    setEditName(currentUser?.name || '');
    if (currentUser?.subjects && currentUser.subjects.length > 0) {
      setEditSubjects(currentUser.subjects);
    } else if (currentUser?.subject) {
      setEditSubjects([currentUser.subject]);
    } else {
      setEditSubjects(['']);
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubjectChange = (index: number, value: string) => {
    const newSubjects = [...editSubjects];
    newSubjects[index] = value;
    setEditSubjects(newSubjects);
  };

  const addEditSubject = () => {
    if (editSubjects.length < 3) {
      setEditSubjects([...editSubjects, '']);
    }
  };

  const removeEditSubject = (index: number) => {
    if (editSubjects.length > 1) {
      const newSubjects = editSubjects.filter((_, i) => i !== index);
      setEditSubjects(newSubjects);
    }
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const validSubjects = editSubjects.filter(s => s.trim() !== '');
    if (!editName || validSubjects.length === 0) return;

    onUpdate({ 
      currentUser: { 
        ...currentUser, 
        name: editName, 
        subject: validSubjects.join(', '), 
        subjects: validSubjects
      } 
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteProfile = () => {
    if (window.confirm(language === 'es' ? '¿Estás seguro de que deseas eliminar tu perfil y cerrar sesión?' : 'Are you sure you want to delete your profile and logout?')) {
      onUpdate({ currentUser: null });
    }
  };

  const colors = [
    { id: 'blue', class: 'bg-sky-500', name: 'Cielo' },
    { id: 'purple', class: 'bg-fuchsia-600', name: 'Fucsia' },
    { id: 'red', class: 'bg-rose-500', name: 'Rosa' },
    { id: 'green', class: 'bg-emerald-500', name: 'Esmeralda' },
    { id: 'orange', class: 'bg-orange-500', name: 'Naranja' },
    { id: 'yellow', class: 'bg-amber-500', name: 'Ámbar' },
    { id: 'teal', class: 'bg-teal-500', name: 'Turquesa' },
    { id: 'indigo', class: 'bg-indigo-500', name: 'Índigo' },
    { id: 'violet', class: 'bg-violet-500', name: 'Violeta' },
    { id: 'pink', class: 'bg-pink-500', name: 'Rosado' },
    { id: 'wine', class: 'bg-rose-900', name: 'Vino Tinto' },
    { id: 'slate', class: 'bg-slate-600', name: 'Pizarra' },
    { id: 'lime', class: 'bg-lime-500', name: 'Lima' }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <header className="mb-10">
        <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.title}</h2>
        <p className="text-gray-500">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className={`border rounded-3xl p-8 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-3 mb-8">
              <Palette className={`text-${vibrant}`} size={22} />
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.apariencia}</h3>
            </div>

            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.modoPantalla}</h4>
                  <p className="text-sm text-gray-500">{t.modoPantallaDesc}</p>
                </div>
                <button 
                  onClick={() => onUpdate({ isDarkMode: !isDarkMode })}
                  className={`w-14 h-8 rounded-full relative p-1 transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isDarkMode ? `translate-x-6 bg-${vibrant} shadow-[0_0_12px_rgba(192,38,211,0.5)]` : 'translate-x-0 bg-white shadow-md'}`}>
                    {isDarkMode ? <Moon size={12} className="text-white" /> : <Sun size={12} className="text-amber-500" />}
                  </div>
                </button>
              </div>

              <div>
                <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.colorInst}</h4>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => onUpdate({ themeColor: color.id })}
                      className="group flex flex-col items-center space-y-2"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${color.class} flex items-center justify-center transition-all ${themeColor === color.id ? `ring-4 ${isDarkMode ? 'ring-white/20' : 'ring-slate-300'} scale-110 shadow-xl` : 'opacity-40 hover:opacity-100 hover:scale-105'}`}>
                        {themeColor === color.id && <Check size={20} className="text-white" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${themeColor === color.id ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-gray-500'}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Languages className={`text-${vibrant}`} size={20} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.idioma}</h4>
                </div>
                <p className="text-sm text-gray-500 mb-6">{t.idiomaDesc}</p>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  {(['es', 'en'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => onUpdate({ language: lang })}
                      className={`px-6 py-4 rounded-2xl font-black transition-all border ${
                        language === lang
                          ? `bg-${vibrant} border-transparent text-white shadow-lg shadow-${vibrant}/20 scale-105`
                          : `${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-500'} hover:opacity-80`
                      }`}
                    >
                      {lang === 'es' ? 'ESPAÑOL' : 'ENGLISH'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Type className={`text-${vibrant}`} size={20} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.tamanoLetra}</h4>
                </div>
                <p className="text-sm text-gray-500 mb-6">{t.tamanoLetraDesc}</p>
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  {[
                    { val: 'small', label: t.letraPequena, desc: '14px' },
                    { val: 'normal', label: t.letraNormal, desc: '16px' },
                    { val: 'large', label: t.letraGrande, desc: '18px' }
                  ].map((sz) => (
                    <button
                      key={sz.val}
                      type="button"
                      onClick={() => onUpdate({ fontSize: sz.val as any })}
                      className={`px-4 py-4 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                        (appState.fontSize || 'normal') === sz.val
                          ? `bg-${vibrant} border-transparent text-white shadow-lg shadow-${vibrant}/20 scale-105`
                          : `${isDarkMode ? 'bg-gray-800 border-gray-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} hover:opacity-80`
                      }`}
                    >
                      <span className="font-black text-xs uppercase tracking-wider mb-0.5">{sz.label}</span>
                      <span className={`text-[10px] font-bold ${(appState.fontSize || 'normal') === sz.val ? 'text-white/75' : 'text-gray-400'}`}>{sz.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={`border rounded-3xl p-8 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Clock className={`text-${vibrant}`} size={22} />
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Horarios / Módulos</h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">Personaliza los rangos de tiempo. Selecciona el nivel para editar sus horarios.</p>
            
            <div className={`flex p-1 rounded-xl mb-6 w-full max-w-sm ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => setEditorSector(Sector.PREPARATORY)}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                  editorSector === Sector.PREPARATORY 
                    ? `bg-white dark:bg-gray-700 shadow-sm text-${vibrant}`
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Preparatoria
              </button>
              <button
                onClick={() => setEditorSector(Sector.SECONDARY)}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${
                  editorSector === Sector.SECONDARY 
                    ? `bg-white dark:bg-gray-700 shadow-sm text-${vibrant}`
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Secundaria
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {editHours.map((hour, idx) => (
                <div key={idx} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-1 rounded-xl border transition-colors ${
                  editingHourIndex === idx
                    ? (isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-300 bg-slate-50')
                    : (isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-slate-100 bg-slate-50/50')
                }`}>
                  {editingHourIndex === idx ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2 px-2 py-1">
                      <input
                        type="time"
                        autoFocus
                        value={hour.split('-')[0]?.trim() || ''}
                        onChange={(e) => {
                          const newEnd = hour.split('-')[1]?.trim() || '';
                          handleHourChange(idx, `${e.target.value} - ${newEnd}`);
                        }}
                        className={`px-3 py-2 rounded-lg bg-transparent border-2 transition-all outline-none ${
                          isDarkMode ? 'border-gray-600 focus:border-gray-400 text-white' : 'border-slate-200 focus:border-slate-400 text-slate-900'
                        }`}
                      />
                      <span className={`font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>-</span>
                      <input
                        type="time"
                        value={hour.split('-')[1]?.trim() || ''}
                        onChange={(e) => {
                          const newStart = hour.split('-')[0]?.trim() || '';
                          handleHourChange(idx, `${newStart} - ${e.target.value}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingHourIndex(null);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg bg-transparent border-2 transition-all outline-none ${
                          isDarkMode ? 'border-gray-600 focus:border-gray-400 text-white' : 'border-slate-200 focus:border-slate-400 text-slate-900'
                        }`}
                      />
                      <button 
                       onClick={() => setEditingHourIndex(null)}
                       className={`ml-auto px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 px-4 py-2 font-medium flex items-center">
                      <span className={`text-xs uppercase font-black tracking-widest mr-3 w-8 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>M_{idx + 1}</span>
                      <span className={`px-2 py-1 rounded border-b-2 text-sm md:text-base ${isDarkMode ? 'border-gray-700 text-gray-300 bg-gray-800/50' : 'border-slate-200 text-slate-700 bg-white'}`}>
                        {hour.split('-')[0]?.trim() || '?'}
                      </span>
                      <span className={`mx-2 text-xs font-black ${isDarkMode ? 'text-gray-600' : 'text-slate-300'}`}>A</span>
                      <span className={`px-2 py-1 rounded border-b-2 text-sm md:text-base ${isDarkMode ? 'border-gray-700 text-gray-300 bg-gray-800/50' : 'border-slate-200 text-slate-700 bg-white'}`}>
                        {hour.split('-')[1]?.trim() || '?'}
                      </span>
                    </div>
                  )}
                  
                  {editingHourIndex !== idx && (
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0 pr-2">
                      <button 
                        onClick={() => toggleRecess(hour)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-[10px] transition-all uppercase tracking-wider ${
                          editRecesses.includes(hour)
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm'
                            : `${isDarkMode ? 'border-gray-800 hover:bg-gray-800/80 hover:border-gray-700 text-gray-500' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500'}`
                        }`}
                        title="Marcar o desmarcar este módulo como Recreo / Receso"
                      >
                        <Coffee size={12} className={editRecesses.includes(hour) ? 'animate-bounce text-amber-500' : ''} />
                        <span>{editRecesses.includes(hour) ? 'Recreo' : 'Clase'}</span>
                      </button>

                      <button 
                        onClick={() => setEditingHourIndex(idx)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                        }`}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => removeHour(idx)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-rose-400' : 'text-slate-400 hover:bg-slate-200 hover:text-rose-500'
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={addHour}
                className={`py-3 px-6 rounded-xl border-2 flex items-center justify-center gap-2 font-bold flex-1 transition-colors ${
                  isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus size={18} />
                AÑADIR HORA
              </button>
              
              <button
                onClick={handleSaveHours}
                className={`flex-1 py-3 px-6 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 bg-${vibrant} shadow-${vibrant}/30`}
              >
                <Save size={18} />
                GUARDAR HORARIOS
              </button>
            </div>
          </section>



          <section className={`border rounded-3xl p-8 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-3 mb-8">
              <User className={`text-${vibrant}`} size={22} />
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.sesionAdm}</h3>
            </div>
            
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-slate-600'}`}>
                  {appState.currentUser ? getInitials(appState.currentUser.name) : '??'}
                </div>
                <div>
                  <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {appState.currentUser?.name || 'Invitado'}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">{appState.currentUser?.subject || 'Sin Materia'}</p>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-${vibrant}/10 text-${vibrant} text-[10px] font-black uppercase inline-flex`}>
                    <ShieldAlert size={10} />
                    {appState.currentUser?.role || 'USER'}
                  </div>
                </div>
              </div>
              <button 
                onClick={openEditModal}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs border transition-all ${isDarkMode ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700' : 'border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              >
                {t.editarPerfil}
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className={`border rounded-3xl p-6 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.preferencias}</h3>
            <div className="space-y-2 mb-6">
              {[
                { label: 'Notificaciones', icon: Bell },
                { label: 'Seguridad / Shield', icon: Shield },
              ].map((item) => (
                <button key={item.label} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`}>
                  <div className="flex items-center space-x-3">
                    <item.icon size={18} className="text-gray-500 group-hover:scale-110 transition-transform" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>{item.label}</span>
                  </div>
                  <Check size={14} className="text-gray-500 opacity-20" />
                </button>
              ))}
            </div>

            {onClearSectorClasses && (
              <div className={`pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
                <h4 className={`font-semibold mb-2 text-rose-500`}>Zona de Peligro</h4>
                <p className="text-xs text-gray-500 mb-4">Elimina todos los horarios generados actualmente para el sector activo ({appState.sector}).</p>
                <button
                  onClick={onClearSectorClasses}
                  className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                >
                  <Trash2 size={16} />
                  Limpiar Horarios ({appState.sector})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.editarPerfil}</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                    isDarkMode 
                      ? `bg-gray-800 border-gray-700 text-white focus:border-${vibrant}` 
                      : `bg-slate-50 border-slate-200 text-slate-900 focus:border-${vibrant} focus:bg-white`
                  }`}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Materia(s) / Asignaturas</label>
                  {editSubjects.length < 3 && (
                    <button
                      type="button"
                      onClick={addEditSubject}
                      className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? `text-${vibrant} hover:text-white` : `text-${vibrant}`}`}
                    >
                      <Plus size={14} /> Añadir otra
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {editSubjects.map((sub, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={sub}
                        onChange={(e) => handleEditSubjectChange(index, e.target.value)}
                        placeholder={index === 0 ? "Ej. Matemáticas" : "Ej. Física II"}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                          isDarkMode 
                            ? `bg-gray-800 border-gray-700 text-white focus:border-${vibrant}` 
                            : `bg-slate-50 border-slate-200 text-slate-900 focus:border-${vibrant} focus:bg-white`
                        }`}
                      />
                      {editSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditSubject(index)}
                          className={`p-3 rounded-xl border-2 transition-colors flex-shrink-0 ${
                            isDarkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-rose-400' : 'border-slate-100 hover:bg-slate-100 text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSaveProfile}
                className={`w-full py-4 bg-${vibrant} text-white font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}
              >
                <Save size={18} />
                GUARDAR CAMBIOS
              </button>
              
              <button 
                onClick={handleDeleteProfile}
                className={`w-full py-4 text-rose-500 font-bold rounded-xl border-2 border-transparent transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}
              >
                <Trash2 size={18} />
                BORRAR PERFIL Y SALIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

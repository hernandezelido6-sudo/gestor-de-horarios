
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Wand2,
  Users, 
  Share2, 
  Settings as SettingsIcon, 
  LogOut, 
  ArrowRightLeft,
  GraduationCap,
  School,
  ShieldAlert,
  ClipboardList,
  Menu,
  X,
  Lock,
  Crown,
  SpellCheck
} from 'lucide-react';
import { NavItem, Sector, Language, User } from '../types';

interface SidebarProps {
  currentNav: NavItem;
  onNavChange: (nav: NavItem) => void;
  sector: Sector;
  onToggleSector: () => void;
  themeColor: string;
  isDarkMode: boolean;
  language: Language;
  currentUser: User | null;
  onLogout: () => void;
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
    inicio: 'Inicio',
    horarios: 'Horarios',
    disponibilidad: 'Disponibilidad',
    prototipo: 'Generador de Horarios',
    profesores: 'Profesores',
    comunidad: 'Comunidad',
    horarioGeneral: 'Horario General',
    compartir: 'Compartir',
    ajustes: 'Ajustes',
    autocorrector: 'Autocorrector',
    cambiarNivel: 'Cambiar Nivel',
    cerrarSesion: 'Cerrar Sesión',
    roleLabel: 'ADMIN / REPORTES',
    prepaLevel: 'Preparatoria',
    secuLevel: 'Secundaria',
    prepaAbbr: 'Prepa',
    active: 'Activa',
    guest: 'Invitado',
    noSubject: 'Sin Materia',
    studyLevel: 'Nivel de Estudios',
    comingSoon: 'Próximamente',
    comingSoonDesc: 'La función de Comunidad de Docentes está reservada para una futura versión de la plataforma. ¡Mantente atento a las actualizaciones!',
    gotIt: 'Entendido'
  },
  en: {
    inicio: 'Home',
    horarios: 'Schedules',
    disponibilidad: 'Availability',
    prototipo: 'Schedule Creator',
    profesores: 'Teachers',
    comunidad: 'Community',
    horarioGeneral: 'General Schedule',
    compartir: 'Share',
    ajustes: 'Settings',
    autocorrector: 'Autocorrect',
    cambiarNivel: 'Change Sector',
    cerrarSesion: 'Logout',
    roleLabel: 'ADMIN / REPORTS',
    prepaLevel: 'High School',
    secuLevel: 'Middle School',
    prepaAbbr: 'High Sch',
    active: 'Active',
    guest: 'Guest',
    noSubject: 'No Subject',
    studyLevel: 'Study Level',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'The Teacher Community feature is reserved for a future release. Stay tuned for his updates!',
    gotIt: 'Got It'
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentNav, 
  onNavChange, 
  sector, 
  onToggleSector,
  themeColor,
  isDarkMode,
  language,
  currentUser,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPremiumLock, setShowPremiumLock] = useState(false);
  const t = translations[language];
  const vibrant = getVibrantColor(themeColor);

  const navItems = [
    { id: NavItem.INICIO, label: t.inicio, icon: LayoutDashboard },
    { id: NavItem.HORARIOS, label: t.horarios, icon: Calendar },
    { id: NavItem.PROTOTIPO, label: t.prototipo, icon: Wand2 },
    { id: NavItem.PROFESORES, label: t.profesores, icon: ClipboardList },
    { id: NavItem.COMUNIDAD, label: t.comunidad, icon: Users, isPro: true },
    { id: NavItem.COMPARTIR, label: t.compartir, icon: Share2 },
    { id: NavItem.AJUSTES, label: t.ajustes, icon: SettingsIcon },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isPro) {
      setIsOpen(false);
      setShowPremiumLock(true);
      return;
    }
    onNavChange(item.id);
    setIsOpen(false);
  };

  const getThemeClass = (id: NavItem) => {
    if (currentNav === id) {
      return `bg-${vibrant} text-white shadow-lg shadow-${themeColor}-900/20`;
    }
    return isDarkMode 
      ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 border-b backdrop-blur-md transition-colors duration-500 ${isDarkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${vibrant}/20 text-${vibrant}`}>
            {sector === Sector.PREPARATORY ? <GraduationCap size={20} /> : <School size={20} />}
          </div>
          <div className="flex flex-col">
            <h1 className={`text-sm font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>CEJPII</h1>
            <span id="mobile-current-level" className={`text-[9px] font-black uppercase tracking-wider text-${vibrant} mt-0.5`}>
              {sector === Sector.PREPARATORY ? t.prepaLevel : t.secuLevel}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-slate-100 text-slate-900'}`}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col h-full transition-all duration-500 
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}
      `}>
        <div className="p-6 hidden lg:flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${vibrant}/20 text-${vibrant}`}>
            {sector === Sector.PREPARATORY ? <GraduationCap size={24} /> : <School size={24} />}
          </div>
          <div className="flex flex-col">
            <h1 className={`text-lg font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>CEJPII</h1>
            <span id="desktop-current-level" className={`text-[10px] font-black uppercase tracking-wider text-${vibrant} mt-1.5`}>
              {sector === Sector.PREPARATORY ? t.prepaLevel : t.secuLevel}
            </span>
          </div>
        </div>

        <div className="px-6 mt-20 lg:mt-0 mb-6">
          <div className={`rounded-2xl p-4 flex flex-col gap-3 transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-gray-700' : 'bg-slate-200 text-slate-600'}`}>
                {currentUser ? getInitials(currentUser.name) : '??'}
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser?.name || t.guest}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">
                  {currentUser?.subject || t.noSubject}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-${vibrant}/20 text-${vibrant} text-[9px] font-black tracking-widest border border-${vibrant}/30`}>
              <ShieldAlert size={12} />
              {currentUser?.role.toUpperCase() || 'USER'}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium ${getThemeClass(item.id)} ${item.isPro ? 'opacity-90' : ''}`}
            >
              <div className="flex items-center space-x-3">
                {item.isPro ? <Lock size={20} className="text-amber-500" /> : <item.icon size={20} />}
                <span>{item.label}</span>
              </div>
              {item.isPro && (
                <span className="text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  PRO
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className={`p-4 mt-auto space-y-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-200'}`}>
          {/* Selector de Nivel de Estudios */}
          <div className="space-y-2">
            <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase block pl-1">
              {t.studyLevel}
            </span>
            <div className={`p-1 rounded-2xl flex gap-1 items-stretch ${isDarkMode ? 'bg-gray-950 border border-gray-800' : 'bg-slate-100 border border-slate-200'}`}>
              <button
                id="btn-level-prepara"
                onClick={() => {
                  if (sector !== Sector.PREPARATORY) {
                    onToggleSector();
                  }
                  if (currentNav === NavItem.HORARIO_GENERAL) {
                    onNavChange(NavItem.INICIO);
                  }
                  setIsOpen(false);
                }}
                className={`flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                  sector === Sector.PREPARATORY && currentNav !== NavItem.HORARIO_GENERAL
                    ? `bg-${vibrant} text-white shadow-md shadow-${themeColor}-900/10`
                    : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`
                }`}
              >
                <GraduationCap size={16} />
                <span className="text-[9px] font-black tracking-tight leading-none">{t.prepaAbbr}</span>
                {sector === Sector.PREPARATORY && currentNav !== NavItem.HORARIO_GENERAL && (
                  <span id="badge-prepa-active" className="text-[6px] font-black uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded leading-none">
                    {t.active}
                  </span>
                )}
              </button>
              
              {/* Botón Central de Horario General Crossover */}
              <button
                id="btn-level-crossover"
                onClick={() => {
                  onNavChange(NavItem.HORARIO_GENERAL);
                  setIsOpen(false);
                }}
                className={`flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                  currentNav === NavItem.HORARIO_GENERAL
                    ? `bg-${vibrant} text-white shadow-md shadow-${themeColor}-900/10`
                    : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`
                }`}
              >
                <Clock size={16} />
                <span className="text-[9px] font-black tracking-tight leading-none text-center">Gral / Cruzado</span>
                {currentNav === NavItem.HORARIO_GENERAL && (
                  <span id="badge-crossover-active" className="text-[6px] font-black uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded leading-none">
                    Activo
                  </span>
                )}
              </button>
              
              <button
                id="btn-level-secu"
                onClick={() => {
                  if (sector !== Sector.SECONDARY) {
                    onToggleSector();
                  }
                  if (currentNav === NavItem.HORARIO_GENERAL) {
                    onNavChange(NavItem.INICIO);
                  }
                  setIsOpen(false);
                }}
                className={`flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                  sector === Sector.SECONDARY && currentNav !== NavItem.HORARIO_GENERAL
                    ? `bg-${vibrant} text-white shadow-md shadow-${themeColor}-900/10`
                    : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`
                }`}
              >
                <School size={16} />
                <span className="text-[9px] font-black tracking-tight leading-none">{t.secuLevel}</span>
                {sector === Sector.SECONDARY && currentNav !== NavItem.HORARIO_GENERAL && (
                  <span id="badge-secu-active" className="text-[6px] font-black uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded leading-none">
                    {t.active}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          <button 
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors font-semibold text-sm"
          >
            <LogOut size={18} />
            <span>{t.cerrarSesion}</span>
          </button>
        </div>
      </aside>

      {/* Premium Lock Modal */}
      {showPremiumLock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 md:p-10 shadow-2xl border text-center ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-amber-500/30">
              <Crown size={40} />
            </div>
            <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {t.comingSoon}
            </h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {t.comingSoonDesc}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowPremiumLock(false)}
                className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-900/20 hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest uppercase"
              >
                {t.gotIt.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

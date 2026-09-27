
import React from 'react';
import { 
  Users, 
  BookOpen, 
  CalendarCheck, 
  Clock, 
  FolderOpen,
  ChevronRight,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import { Sector, Language, NavItem, TeacherAvailability } from '../types';
import { SCHOOL_STATS, CURRICULUM } from '../constants';

interface DashboardProps {
  sector: Sector;
  themeColor: string;
  isDarkMode: boolean;
  language: Language;
  stats: {
    totalClasses: number;
    activeTeachers: number;
    availabilityPercentage: string;
    roomsInUse: number;
    registeredSubjects: number;
    groupsCount: number;
  };
  availabilities: TeacherAvailability[];
  onNavigate: (nav: NavItem) => void;
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
    resumen: 'Resumen De',
    panelControl: 'Panel de control con persistencia activa.',
    clasesTotales: 'Clases Totales',
    profesoresActivos: 'Profesores Activos',
    disponibilidad: 'Disponibilidad',
    aulasUso: 'Aulas en Uso',
    materiasRegistradas: 'Materias Registradas',
    verGestion: 'Ver Gestión',
    vacioMsg: 'Empieza agregando materias en la sección Horarios para visualizar el resumen aquí.',
    disponibilidadDocente: 'Disponibilidad Docente',
    noRegistros: 'No se han registrado disponibilidades aún.'
  },
  en: {
    resumen: 'Overview of',
    panelControl: 'Control panel with active persistence.',
    clasesTotales: 'Total Classes',
    profesoresActivos: 'Active Teachers',
    disponibilidad: 'Availability',
    aulasUso: 'Classrooms in Use',
    materiasRegistradas: 'Registered Subjects',
    verGestion: 'View Management',
    vacioMsg: 'Start by adding subjects in the Schedules section to see the overview here.',
    disponibilidadDocente: 'Teacher Availability',
    noRegistros: 'No availabilities recorded yet.'
  }
};

const StatCard: React.FC<{ icon: any, label: string, value: string | number, color: string, isDarkMode: boolean }> = ({ icon: Icon, label, value, color, isDarkMode }) => (
  <div className={`border p-5 rounded-2xl transition-all group ${isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Activo</div>
    </div>
    <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ sector, themeColor, isDarkMode, language, stats, availabilities, onNavigate }) => {
  const vibrant = getVibrantColor(themeColor);
  const t = translations[language];

  const totalCurriculumSubjects = sector === Sector.PREPARATORY 
    ? Object.values((CURRICULUM[Sector.PREPARATORY] as any).semesters).reduce((acc: number, curr: any) => acc + curr.length, 0)
    : (CURRICULUM[Sector.SECONDARY] as any).subjects.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.resumen} {sector}</h2>
          <p className="text-gray-500">{t.panelControl}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-gray-900 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
           Sistema Operativo
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={BookOpen} label={t.clasesTotales} value={stats.totalClasses} color={vibrant} isDarkMode={isDarkMode} />
        <StatCard icon={Users} label={t.profesoresActivos} value={stats.activeTeachers} color={vibrant} isDarkMode={isDarkMode} />
        <StatCard icon={FolderOpen} label="Grupos Gestionados" value={`${stats.groupsCount} / ${sector === Sector.PREPARATORY ? SCHOOL_STATS.preparatoryGroups : SCHOOL_STATS.secondaryGroups}`} color={vibrant} isDarkMode={isDarkMode} />
        <StatCard icon={Clock} label={t.aulasUso} value={`${stats.roomsInUse} / ${sector === Sector.SECONDARY ? SCHOOL_STATS.secondaryClassrooms : '16'}`} color={vibrant} isDarkMode={isDarkMode} />
      </div>

      <div className="max-w-6xl space-y-12">
        {/* Curriculo Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <BookOpen className={`text-${vibrant}`} size={20} />
              Estructura Académica {new Date().getFullYear()}-{new Date().getFullYear() + 1}
            </h3>
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Global: {totalCurriculumSubjects} Materias</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sector === Sector.PREPARATORY ? (
              [2, 4, 6].map(sem => (
                <div key={sem} className={`p-5 rounded-2xl border flex flex-col h-full ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                  <h4 className={`font-black text-xs uppercase tracking-widest mb-3 text-${vibrant}`}>{sem}º Semestre</h4>
                  <ul className="space-y-1.5 flex-1">
                    {(CURRICULUM[Sector.PREPARATORY] as any).semesters[sem].slice(0, 5).map((m: string) => (
                      <li key={m} className="text-[11px] text-gray-500 flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full bg-${vibrant}/40`} />
                        {m}
                      </li>
                    ))}
                    <li className="text-[10px] text-gray-400 italic mt-2">+ {(CURRICULUM[Sector.PREPARATORY] as any).semesters[sem].length - 5} materias adicionales</li>
                  </ul>
                  <button 
                    onClick={() => onNavigate(NavItem.HORARIOS)}
                    className={`mt-4 w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-${vibrant}/5 text-${vibrant} hover:bg-${vibrant} hover:text-white transition-all`}
                  >
                    Programar Semestre
                  </button>
                </div>
              ))
            ) : (
              ([1, 2, 3] as number[]).map(grade => (
                <div key={grade} className={`p-5 rounded-2xl border flex flex-col h-full ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                  <h4 className={`font-black text-xs uppercase tracking-widest mb-3 text-${vibrant}`}>{grade}º Grado</h4>
                  <ul className="space-y-1.5 flex-1">
                    {((CURRICULUM[Sector.SECONDARY] as any).grades[grade] as string[]).slice(0, 7).map((m: string) => (
                      <li key={m} className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full bg-${vibrant}/40`} />
                        <span className="truncate">{m}</span>
                      </li>
                    ))}
                    {((CURRICULUM[Sector.SECONDARY] as any).grades[grade] as string[]).length > 7 && (
                      <li className="text-[10px] text-gray-400 italic mt-2">+ {((CURRICULUM[Sector.SECONDARY] as any).grades[grade] as string[]).length - 7} materias adicionales</li>
                    )}
                  </ul>
                  <button 
                    onClick={() => onNavigate(NavItem.HORARIOS)}
                    className={`mt-4 w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-${vibrant}/5 text-${vibrant} hover:bg-${vibrant} hover:text-white transition-all`}
                  >
                    Programar Grado
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Disponibilidad section - IMPROVED */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <UserCheck className={`text-${vibrant}`} size={20} />
              {t.disponibilidadDocente}
              <span className={`px-3 py-1 rounded-full text-xs font-black bg-${vibrant}/10 text-${vibrant}`}>{availabilities.length}</span>
            </h3>
            <button 
              onClick={() => onNavigate(NavItem.PROFESORES)}
              className="text-xs font-bold text-gray-500 hover:text-slate-400 transition-colors flex items-center gap-1"
            >
              Ver Lista Completa <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availabilities.slice(0, 4).map(teacher => (
              <div key={teacher.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {teacher.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{teacher.name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{teacher.subjects?.join(', ') || teacher.subject}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${teacher.slots.length > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {teacher.slots.length > 0 ? `${teacher.slots.length} Horas Disponibles` : 'Sin Disponibilidad'}
                </div>
              </div>
            ))}
            {availabilities.length === 0 && (
               <div className={`col-span-2 py-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isDarkMode ? 'border-gray-800 bg-gray-900/40' : 'border-slate-100 bg-slate-50'}`}>
                 <Users className="text-gray-300 mb-2" size={32} />
                 <p className="text-xs text-gray-500 font-medium">{t.noRegistros}</p>
               </div>
            )}
          </div>
        </section>

        {/* Materias Registradas section - IMPROVED */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <FolderOpen className={`text-${vibrant}`} size={20} />
              {t.materiasRegistradas}
              <span className={`px-3 py-1 rounded-full text-xs font-black bg-${vibrant}/10 text-${vibrant}`}>
                {totalCurriculumSubjects > 0 ? `${stats.registeredSubjects} / ${totalCurriculumSubjects}` : `${stats.registeredSubjects} registradas`}
              </span>
            </h3>
            <button 
              onClick={() => onNavigate(NavItem.HORARIOS)}
              className="text-xs font-bold text-gray-500 hover:text-slate-400 transition-colors flex items-center gap-1 underline decoration-dashed decoration-gray-400"
            >
              {t.verGestion} <ChevronRight size={14} />
            </button>
          </div>

          <div className={`border rounded-[2.5rem] p-8 transition-colors relative overflow-hidden ${isDarkMode ? 'bg-indigo-900/10 border-indigo-900/20' : 'bg-indigo-50 border-indigo-100'}`}>
             <div className="relative z-10">
               <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-3xl ${isDarkMode ? 'bg-indigo-900/50' : 'bg-white shadow-sm'}`}>
                    <CalendarDays className="text-indigo-500" size={32} />
                  </div>
                  <div>
                    <p className={`font-black uppercase text-xs tracking-widest ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>Estado de la Currícula</p>
                    <p className="text-gray-500 text-xs">Monitoreo de carga académica activa por grupos.</p>
                  </div>
               </div>
               
               <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-6 relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${totalCurriculumSubjects > 0 ? Math.min(100, (stats.registeredSubjects / totalCurriculumSubjects) * 100) : 100}%` }}
                  />
               </div>

               {stats.registeredSubjects === 0 ? (
                 <div className="flex flex-col items-center py-6">
                   <p className="text-gray-500 max-w-sm mb-6 text-sm text-center">{t.vacioMsg}</p>
                   <button 
                    onClick={() => onNavigate(NavItem.PROTOTIPO)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-105 transition-all"
                   >
                     Usar Generador de Horarios
                   </button>
                 </div>
               ) : (
                 <div className="flex items-center justify-between">
                    <p className="text-gray-500 text-sm font-medium">Hay {stats.registeredSubjects} materias asignadas exitosamente en el horario actual.</p>
                    <button 
                      onClick={() => onNavigate(NavItem.HORARIOS)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                    >
                      Ver Matriz de Horarios
                    </button>
                 </div>
               )}
             </div>

             {/* Background Decoration */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>
      </div>
    </div>
  );
};

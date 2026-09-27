
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Search, 
  Calendar, 
  MapPin, 
  LayoutList,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  FileSpreadsheet,
  Check,
  Shuffle,
  RefreshCw
} from 'lucide-react';
import { TeacherAvailability, Sector, Language } from '../types';
import { CURRICULUM } from '../constants';
import * as XLSX from 'xlsx';

interface TeachersAvailabilityProps {
  availabilities: TeacherAvailability[];
  allAvailabilities?: TeacherAvailability[];
  themeColor: string;
  isDarkMode: boolean;
  onSaveTeacher?: (record: TeacherAvailability) => Promise<void> | void;
  onDeleteTeacher?: (id: string) => Promise<void> | void;
  hours: string[];
  sector: Sector;
  language?: Language;
  onRefreshData?: () => Promise<void> | void;
}

const translations = {
  es: {
    title: 'Profesores Disponibles',
    subtitle: 'Gestión de disponibilidad docente.',
    adminPanel: 'Panel Administrativo',
    filterPlaceholder: 'Filtrar por nombre...',
    addTeacherTitle: 'Añadir Profesor',
    importExcel: 'Importar de Excel / CSV',
    exportExcel: 'Exportar a Excel',
    importing: 'Importando...',
    reading: 'Leyendo...',
    noData: 'Sin datos registrados',
    teacherAvailabilityOf: 'Disponibilidad de:',
    subjectLabel: 'Materia:',
    editAvailability: 'Editar',
    deleteTeacher: 'Eliminar',
    saveChanges: 'Guardar',
    cancel: 'Cancelar',
    weekdays: 'Todos los días de la semana',
    clearAvailability: 'Limpiar disponibilidad',
    selectTeacherMsg: 'Selecciona un docente de la lista lateral para visualizar o editar sus horarios de disponibilidad en la rejilla gráfica.',
    fullName: 'Nombre del Profesor/a',
    subjectField: 'Materia de Especialidad',
    addTeacherProgress: 'Añadir nuevo docente...',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    importSuccess: '¡Importación exitosa! Se cargaron {count} profesores con su materia de especialidad.',
    importError: 'Ocurrió un error al procesar el archivo Excel. Asegúrate de tener columnas con encabezados como \'Nombre del Profesor\' y \'Materia\'.',
    orManual: 'O registrar manualmente',
    createTeacher: 'Crear Profesor',
    excelBannerTitle: '¿Tienes un archivo de Excel / CSV?',
    excelBannerDesc: 'Importa tu lista de profesores y sus especialidades automáticamente.',
    searchFile: 'Buscar Archivo Excel',
    hoursCount: 'Horas',
    lastUpdated: 'Actualizado:',
    clickHelp: 'Haz clic en las casillas para modificar los horarios.',
    viewerTitle: 'Visor de Disponibilidad',
    generalSubject: 'Materia General',
    subjectsListLabel: 'Materias que imparte',
    addSubjectBtn: 'Añadir',
    noSubjectsWarning: 'Debe añadir al menos una materia para registrar al profesor.',
    subjectPlaceholder: 'Selecciona o escribe una materia...',
    unlimitedSubjectsHelp: '¡Sin límites! Puedes agregar más de 10 materias para este profesor y el sistema las programará correctamente.'
  },
  en: {
    title: 'Available Teachers',
    subtitle: 'Faculty availability management.',
    adminPanel: 'Admin Panel',
    filterPlaceholder: 'Search by name...',
    addTeacherTitle: 'Add Teacher',
    importExcel: 'Import from Excel / CSV',
    exportExcel: 'Export to Excel',
    importing: 'Importing...',
    reading: 'Reading...',
    noData: 'No records registered',
    teacherAvailabilityOf: 'Availability of:',
    subjectLabel: 'Subject:',
    editAvailability: 'Edit',
    deleteTeacher: 'Delete',
    saveChanges: 'Save',
    cancel: 'Cancel',
    weekdays: 'All weekdays',
    clearAvailability: 'Clear availability',
    selectTeacherMsg: 'Select a teacher in the side panel to view or edit their availability schedules in the graphical grid.',
    fullName: 'Teacher Full Name',
    subjectField: 'Specialized Subject',
    addTeacherProgress: 'Add new teacher...',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    importSuccess: 'Success! Imported {count} teachers with their subject specialty.',
    importError: 'An error occurred while processing the Excel. Please ensure you have columns with headers like \'Nombre del Profesor\' and \'Materia\' or \'Teacher Name\' and \'Subject\'.',
    orManual: 'Or register manually',
    createTeacher: 'Create Teacher',
    excelBannerTitle: 'Do you have an Excel / CSV file?',
    excelBannerDesc: 'Import your list of teachers and their specialties automatically.',
    searchFile: 'Search Excel File',
    hoursCount: 'Hours',
    lastUpdated: 'Updated:',
    clickHelp: 'Click on the slots to modify the schedule.',
    viewerTitle: 'Availability Viewer',
    generalSubject: 'General Subject',
    subjectsListLabel: 'Subjects Taught',
    addSubjectBtn: 'Add',
    noSubjectsWarning: 'Must add at least one subject to register the teacher.',
    subjectPlaceholder: 'Select or type a subject...',
    unlimitedSubjectsHelp: 'No limits! You can add more than 10 subjects for this teacher and the engine will schedule them properly.'
  }
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

export const PREP_CLEAN_SUBJECTS = [
  'lengua y comunicacion i', 'lengua y comunicacion ii', 'lengua y comunicacion iii',
  'pensamiento matematico i', 'pensamiento matematico ii', 'pensamiento matematico iii',
  'pensamiento matematico iv', 'pensamiento matematico v', 'pensamiento matematico vi',
  'ciencias naturales, experimentales y tecnologia i', 'ciencias naturales, experimentales y tecnologia ii',
  'ciencias naturales, experimentales y tecnologia iii', 'ciencias naturales, experimentales y tecnologia iv',
  'ciencias naturales, experimentales y tecnologia v', 'ciencias naturales, experimentales y tecnologia vi',
  'ciencias sociales i', 'ciencias sociales ii', 'ciencias sociales iii',
  'laboratorio de investigacion',
  'pensamiento filosofico y humanidades i', 'pensamiento filosofico y humanidades ii', 'pensamiento filosofico y humanidades iii',
  'cultura digital i', 'cultura digital ii', 'cultura digital iii',
  'ingles i', 'ingles ii', 'ingles iii', 'ingles iv', 'ingles v', 'ingles vi',
  'formacion socioemocional i', 'formacion socioemocional ii', 'formacion socioemocional iii',
  'formacion socioemocional iv', 'formacion socioemocional v', 'formacion socioemocional vi',
  'taller de ciencias', 'taller cultural',
  'submodulo i', 'submodulo ii', 'submodulo iii', 'submodulo iv',
  'submodulo v', 'submodulo vi', 'submodulo vii', 'submodulo viii',
  'conciencia historica i', 'pensamiento literario',
  'conciencia historica ii. mexico durante el expansionismo capitalista',
  'la energia en los proceso de la vida diario',
  'asignatura del componente de formacion fundamental extendida (optativa)',
  'organismos estructurar y procesos, herencia y evolucion biologica',
  'informatica', 'servicios turisticos', 'dibujo arquitectonico y de construccion',
  'contabilidad', 'turismo alternativo', 'auxiliar de enfermeria',
  'laboratorista quimico', 'primeros auxilios',
  'fisico-matematico', 'quimico-biologico', 'economico-administrativo',
  'humanidades y ciencias sociales',
  'prepa', 'preparatoria'
];

export const SEC_CLEAN_SUBJECTS = [
  'artes i', 'biologia i', 'educacion fisica i', 'educacion fisica ii', 'educacion fisica iii',
  'espanol i', 'espanol ii', 'espanol iii',
  'formacion civica y etica i', 'formacion civica y etica ii', 'formacion civica y etica iii',
  'geografia i', 'historia i', 'historia ii', 'historia iii',
  'ingles i', 'ingles ii', 'ingles iii',
  'matematicas i', 'matematicas ii', 'matematicas iii',
  'tecnologia i', 'tecnologia ii', 'tecnologia iii',
  'tutoria y orientacion educ. i', 'tutoria y orientacion educ. ii', 'tutoria y orientacion educ. iii',
  'talleres: miercoles de 7:00 a 8:40 hrs.', 'clubes: jueves de 7:00 a 8:40 hrs.',
  'fisica ii', 'musica ii', 'quimica iii', 'teatro iii',
  'talleres', 'clubes',
  'secundaria'
];

export const cleanSubject = (s: string) => {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export const subjectBelongsToSector = (rawSubjectStr: string, currentSector: Sector): boolean => {
  const cleanSub = cleanSubject(rawSubjectStr);
  if (!cleanSub) return false;

  const PREP_KEYWORDS = [
    'submodulo', 'pensamiento filosofico', 'cultura digital', 'formacion socioemocional',
    'ciencias sociales', 'ciencias naturales', 'laboratorio de investigacion',
    'prepa', 'preparatoria', 'optativa', 'organismos estructurar',
    'contabilidad', 'turismo', 'enfermeria', 'dibujo', 'arquitectonico',
    'laboratorista', 'fisico-matematico', 'quimico-biologico', 'economico-administrativo',
    'pensamiento matematico', 'taller de ciencias', 'taller cultural', 'lengua y comunicacion', 'conciencia historica'
  ];

  const SEC_KEYWORDS = [
    'espanol', 'geografia', 'biologia i', 'fisica ii', 'quimica iii', 'musica', 'teatro',
    'secundaria', 'clubes', 'tutoria y orientacion', 'artes i'
  ];

  const isPrepSpecific = PREP_KEYWORDS.some(kw => cleanSub.includes(kw)) || 
    PREP_CLEAN_SUBJECTS.includes(cleanSub);

  const isSecSpecific = SEC_KEYWORDS.some(kw => cleanSub.includes(kw)) ||
    SEC_CLEAN_SUBJECTS.includes(cleanSub);

  if (currentSector === Sector.PREPARATORY) {
    if (isPrepSpecific) return true;
    if (isSecSpecific) return false;
    return true; // default true
  } else { // secondary
    if (isSecSpecific) return true;
    if (isPrepSpecific) return false;
    return true; // default true
  }
};

interface TeacherTheme {
  lightBg: string;
  lightBorder: string;
  lightText: string;
  lightHoverBorder: string;
  lightHoverBg: string;
  lightInitialsBg: string;
  lightInitialsText: string;
  darkBg: string;
  darkBorder: string;
  darkText: string;
  darkHoverBorder: string;
  darkHoverBg: string;
  darkInitialsBg: string;
  darkInitialsText: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedShadow: string;
}

const TEACHER_THEMES: TeacherTheme[] = [
  {
    // violet
    lightBg: 'bg-violet-50/70',
    lightBorder: 'border-violet-100',
    lightText: 'text-violet-800',
    lightHoverBorder: 'hover:border-violet-300',
    lightHoverBg: 'hover:bg-violet-100/40',
    lightInitialsBg: 'bg-violet-100/70',
    lightInitialsText: 'text-violet-700',
    darkBg: 'bg-violet-950/20',
    darkBorder: 'border-violet-900/30',
    darkText: 'text-violet-300',
    darkHoverBorder: 'hover:border-violet-700',
    darkHoverBg: 'hover:bg-violet-900/10',
    darkInitialsBg: 'bg-violet-900/40',
    darkInitialsText: 'text-violet-300',
    selectedBg: 'bg-violet-600',
    selectedBorder: 'border-violet-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-violet-900/40'
  },
  {
    // emerald
    lightBg: 'bg-emerald-50/70',
    lightBorder: 'border-emerald-100',
    lightText: 'text-emerald-800',
    lightHoverBorder: 'hover:border-emerald-300',
    lightHoverBg: 'hover:bg-emerald-100/40',
    lightInitialsBg: 'bg-emerald-100/70',
    lightInitialsText: 'text-emerald-700',
    darkBg: 'bg-emerald-950/20',
    darkBorder: 'border-emerald-900/30',
    darkText: 'text-emerald-300',
    darkHoverBorder: 'hover:border-emerald-700',
    darkHoverBg: 'hover:bg-emerald-900/10',
    darkInitialsBg: 'bg-emerald-900/40',
    darkInitialsText: 'text-emerald-300',
    selectedBg: 'bg-emerald-600',
    selectedBorder: 'border-emerald-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-emerald-900/40'
  },
  {
    // rose
    lightBg: 'bg-rose-50/70',
    lightBorder: 'border-rose-100',
    lightText: 'text-rose-800',
    lightHoverBorder: 'hover:border-rose-300',
    lightHoverBg: 'hover:bg-rose-100/40',
    lightInitialsBg: 'bg-rose-100/70',
    lightInitialsText: 'text-rose-700',
    darkBg: 'bg-rose-950/20',
    darkBorder: 'border-rose-900/30',
    darkText: 'text-rose-300',
    darkHoverBorder: 'hover:border-rose-700',
    darkHoverBg: 'hover:bg-rose-900/10',
    darkInitialsBg: 'bg-rose-900/40',
    darkInitialsText: 'text-rose-300',
    selectedBg: 'bg-rose-600',
    selectedBorder: 'border-rose-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-rose-900/40'
  },
  {
    // amber
    lightBg: 'bg-amber-50/70',
    lightBorder: 'border-amber-100',
    lightText: 'text-amber-800',
    lightHoverBorder: 'hover:border-amber-300',
    lightHoverBg: 'hover:bg-amber-100/40',
    lightInitialsBg: 'bg-amber-100/70',
    lightInitialsText: 'text-amber-700',
    darkBg: 'bg-amber-950/20',
    darkBorder: 'border-amber-900/30',
    darkText: 'text-amber-300',
    darkHoverBorder: 'hover:border-amber-700',
    darkHoverBg: 'hover:bg-amber-900/10',
    darkInitialsBg: 'bg-amber-900/40',
    darkInitialsText: 'text-amber-300',
    selectedBg: 'bg-amber-600',
    selectedBorder: 'border-amber-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-amber-900/40'
  },
  {
    // sky
    lightBg: 'bg-sky-50/70',
    lightBorder: 'border-sky-100',
    lightText: 'text-sky-800',
    lightHoverBorder: 'hover:border-sky-300',
    lightHoverBg: 'hover:bg-sky-100/40',
    lightInitialsBg: 'bg-sky-100/70',
    lightInitialsText: 'text-sky-700',
    darkBg: 'bg-sky-950/20',
    darkBorder: 'border-sky-900/30',
    darkText: 'text-sky-300',
    darkHoverBorder: 'hover:border-sky-700',
    darkHoverBg: 'hover:bg-sky-900/10',
    darkInitialsBg: 'bg-sky-900/40',
    darkInitialsText: 'text-sky-300',
    selectedBg: 'bg-sky-600',
    selectedBorder: 'border-sky-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-sky-900/40'
  },
  {
    // indigo
    lightBg: 'bg-indigo-50/70',
    lightBorder: 'border-indigo-100',
    lightText: 'text-indigo-800',
    lightHoverBorder: 'hover:border-indigo-300',
    lightHoverBg: 'hover:bg-indigo-100/40',
    lightInitialsBg: 'bg-indigo-100/70',
    lightInitialsText: 'text-indigo-700',
    darkBg: 'bg-indigo-950/20',
    darkBorder: 'border-indigo-900/30',
    darkText: 'text-indigo-300',
    darkHoverBorder: 'hover:border-indigo-700',
    darkHoverBg: 'hover:bg-indigo-900/10',
    darkInitialsBg: 'bg-indigo-900/40',
    darkInitialsText: 'text-indigo-300',
    selectedBg: 'bg-indigo-600',
    selectedBorder: 'border-indigo-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-indigo-900/40'
  },
  {
    // teal
    lightBg: 'bg-teal-50/70',
    lightBorder: 'border-teal-100',
    lightText: 'text-teal-800',
    lightHoverBorder: 'hover:border-teal-300',
    lightHoverBg: 'hover:bg-teal-100/40',
    lightInitialsBg: 'bg-teal-100/70',
    lightInitialsText: 'text-teal-700',
    darkBg: 'bg-teal-950/20',
    darkBorder: 'border-teal-900/30',
    darkText: 'text-teal-300',
    darkHoverBorder: 'hover:border-teal-700',
    darkHoverBg: 'hover:bg-teal-900/10',
    darkInitialsBg: 'bg-teal-900/40',
    darkInitialsText: 'text-teal-300',
    selectedBg: 'bg-teal-600',
    selectedBorder: 'border-teal-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-teal-900/40'
  },
  {
    // orange
    lightBg: 'bg-orange-50/70',
    lightBorder: 'border-orange-100',
    lightText: 'text-orange-850',
    lightHoverBorder: 'hover:border-orange-300',
    lightHoverBg: 'hover:bg-orange-100/40',
    lightInitialsBg: 'bg-orange-100/70',
    lightInitialsText: 'text-orange-700',
    darkBg: 'bg-orange-950/20',
    darkBorder: 'border-orange-900/30',
    darkText: 'text-orange-300',
    darkHoverBorder: 'hover:border-orange-700',
    darkHoverBg: 'hover:bg-orange-900/10',
    darkInitialsBg: 'bg-orange-900/40',
    darkInitialsText: 'text-orange-300',
    selectedBg: 'bg-orange-600',
    selectedBorder: 'border-orange-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-orange-900/40'
  },
  {
    // fuchsia
    lightBg: 'bg-fuchsia-50/70',
    lightBorder: 'border-fuchsia-100',
    lightText: 'text-fuchsia-800',
    lightHoverBorder: 'hover:border-fuchsia-300',
    lightHoverBg: 'hover:bg-fuchsia-100/40',
    lightInitialsBg: 'bg-fuchsia-100/70',
    lightInitialsText: 'text-fuchsia-700',
    darkBg: 'bg-fuchsia-950/20',
    darkBorder: 'border-fuchsia-900/30',
    darkText: 'text-fuchsia-300',
    darkHoverBorder: 'hover:border-fuchsia-700',
    darkHoverBg: 'hover:bg-fuchsia-900/10',
    darkInitialsBg: 'bg-fuchsia-900/40',
    darkInitialsText: 'text-fuchsia-300',
    selectedBg: 'bg-fuchsia-600',
    selectedBorder: 'border-fuchsia-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-fuchsia-900/40'
  },
  {
    // cyan
    lightBg: 'bg-cyan-50/70',
    lightBorder: 'border-cyan-100',
    lightText: 'text-cyan-800',
    lightHoverBorder: 'hover:border-cyan-300',
    lightHoverBg: 'hover:bg-cyan-100/40',
    lightInitialsBg: 'bg-cyan-100/70',
    lightInitialsText: 'text-cyan-700',
    darkBg: 'bg-cyan-950/20',
    darkBorder: 'border-cyan-900/30',
    darkText: 'text-cyan-300',
    darkHoverBorder: 'hover:border-cyan-700',
    darkHoverBg: 'hover:bg-cyan-900/10',
    darkInitialsBg: 'bg-cyan-900/40',
    darkInitialsText: 'text-cyan-300',
    selectedBg: 'bg-cyan-600',
    selectedBorder: 'border-cyan-600',
    selectedText: 'text-white',
    selectedShadow: 'shadow-cyan-900/40'
  }
];

const getTeacherTheme = (teacherId: string) => {
  let hash = 0;
  const key = teacherId || 'default-id';
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TEACHER_THEMES.length;
  TEACHER_THEMES[index];
  return TEACHER_THEMES[index];
};

export const TeachersAvailability: React.FC<TeachersAvailabilityProps> = ({ availabilities, allAvailabilities, themeColor, isDarkMode, onSaveTeacher, onDeleteTeacher, hours, sector, language = 'es', onRefreshData }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedTeacherIds, setCheckedTeacherIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempSlots, setTempSlots] = useState<string[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempSubject, setTempSubject] = useState('');
  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string[]>([]);
  const [subjectInputText, setSubjectInputText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [customToast, setCustomToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importConsoleLogs, setImportConsoleLogs] = useState<string[]>([]);
  const [importStep, setImportStep] = useState('');
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const handleRefresh = async () => {
    setLocalRefreshing(true);
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      
      // Guardar bandera en localStorage para mostrar confirmación tras recarga
      localStorage.setItem('sys_refreshed_toast', 'true');
      
      // Recargar la página totalmente para limpiar cualquier conflicto de memoria o error de renderizado
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast(
        language === 'es' ? 'Error al actualizar: mostrando datos sin conexión' : 'Refresh failed: showing offline data',
        'error'
      );
      setLocalRefreshing(false);
    }
  };
  
  const vibrant = getVibrantColor(themeColor);
  const t = translations[language];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCustomToast({ message, type });
  };

  const handleExportExcel = () => {
    const teachersPool = allAvailabilities?.length ? allAvailabilities : availabilities;

    if (teachersPool.length === 0) {
      alert(
        language === 'es'
          ? 'No hay profesores registrados para exportar.'
          : 'There are no teachers registered to export.'
      );
      return;
    }

    const wb = XLSX.utils.book_new();

    // 1. Prepare Preparatoria Data
    const prepaRows: any[] = [];
    teachersPool.forEach(teacher => {
      const subjects = teacher.subjects && teacher.subjects.length > 0 
        ? teacher.subjects 
        : [teacher.subject || 'General'];

      // Filter subjects that belong to PREPARATORIA
      const prepSubjects = subjects.filter(sub => subjectBelongsToSector(sub, Sector.PREPARATORY));

      // Only include teacher if they have at least one Prep subject
      if (prepSubjects.length > 0) {
        prepaRows.push({
          'Docente / Profesor': teacher.name,
          'Materias que Imparte (Preparatoria)': prepSubjects.join(', '),
          'Módulos de Disponibilidad': teacher.slots && teacher.slots.length > 0 
            ? teacher.slots.join(', ') 
            : (language === 'es' ? 'Ninguno' : 'None')
        });
      }
    });

    // 2. Prepare Secundaria Data
    const secuRows: any[] = [];
    teachersPool.forEach(teacher => {
      const subjects = teacher.subjects && teacher.subjects.length > 0 
        ? teacher.subjects 
        : [teacher.subject || 'General'];

      // Filter subjects that belong to SECONDARY
      const secuSubjects = subjects.filter(sub => subjectBelongsToSector(sub, Sector.SECONDARY));

      if (secuSubjects.length > 0) {
        secuRows.push({
          'Docente / Profesor': teacher.name,
          'Materias que Imparte (Secundaria)': secuSubjects.join(', '),
          'Módulos de Disponibilidad': teacher.slots && teacher.slots.length > 0 
            ? teacher.slots.join(', ') 
            : (language === 'es' ? 'Ninguno' : 'None')
        });
      }
    });

    // Create Prep sheet if there are rows
    if (prepaRows.length > 0) {
      const wsPrepa = XLSX.utils.json_to_sheet(prepaRows);
      wsPrepa['!cols'] = [
        { wch: 35 }, // Docente
        { wch: 55 }, // Materias
        { wch: 45 }  // Disponibilidad
      ];
      XLSX.utils.book_append_sheet(wb, wsPrepa, "Preparatoria");
    }

    // Create Secu sheet if there are rows
    if (secuRows.length > 0) {
      const wsSecu = XLSX.utils.json_to_sheet(secuRows);
      wsSecu['!cols'] = [
        { wch: 35 }, // Docente
        { wch: 55 }, // Materias
        { wch: 45 }  // Disponibilidad
      ];
      XLSX.utils.book_append_sheet(wb, wsSecu, "Secundaria");
    }

    // Check if we appended any sheet at all
    if (wb.SheetNames.length === 0) {
      alert(
        language === 'es'
          ? 'No hay docentes con materias asignadas a Preparatoria o Secundaria para exportar.'
          : 'There are no teachers with subjects assigned to Preparatory or Secondary to export.'
      );
      return;
    }

    // Write workbook and download
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const s2ab = (s: string) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };
      
      const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Docentes_por_Sector_${new Date().toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US').replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(language === 'es' ? 'Exportación completada con éxito.' : 'Export completed successfully.');
    } catch (e) {
      console.error("Error al exportar Excel:", e);
      alert(
        language === 'es'
          ? 'Hubo un problema al generar el archivo de Excel.'
          : 'There was a problem generating the Excel file.'
      );
    }
  };

  const handleRandomizeAvailabilities = async () => {
    const targets = checkedTeacherIds.length > 0 
      ? filteredAvailabilities.filter(t => checkedTeacherIds.includes(t.id))
      : filteredAvailabilities;

    if (targets.length === 0) {
      showToast(
        language === 'es' ? 'No hay profesores para aleatorizar.' : 'No teachers found to randomize.',
        'error'
      );
      return;
    }

    if (!onSaveTeacher) return;

    const daysToUse = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    setIsImporting(true);

    try {
      for (const teacher of targets) {
        const randomSlots: string[] = [];
        daysToUse.forEach(day => {
          hours.forEach(hour => {
            if (Math.random() < 0.6) { // 60% probability
              randomSlots.push(`${day}-${hour}`);
            }
          });
        });

        await onSaveTeacher({
          ...teacher,
          slots: randomSlots
        });
      }
      showToast(
        language === 'es' 
          ? `Disponibilidades aleatorias creadas para ${targets.length} profesores.` 
          : `Random availabilities created for ${targets.length} teachers.`
      );
    } catch (e) {
      console.error(e);
      showToast(
        language === 'es' ? 'Error al guardar las disponibilidades.' : 'Error saving availabilities.',
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    if (customToast) {
      const timer = setTimeout(() => {
        setCustomToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [customToast]);

  useEffect(() => {
    const wasRefreshed = localStorage.getItem('sys_refreshed_toast');
    if (wasRefreshed) {
      localStorage.removeItem('sys_refreshed_toast');
      showToast(
        language === 'es' ? '¡Sistema reiniciado, limpio de fallos y sincronizado!' : 'System refreshed, cleared of errors, and synchronised!',
        'success'
      );
    }
  }, [language]);

  const allSubjects = React.useMemo(() => {
    const s = new Set<string>();
    
    if (sector === Sector.SECONDARY) {
      const sec = CURRICULUM[Sector.SECONDARY];
      sec.subjects.forEach((sub: string) => s.add(sub));
    } else {
      const prep = CURRICULUM[Sector.PREPARATORY];
      Object.values(prep.semesters).forEach((semesterSubjects: string[]) => {
        semesterSubjects.forEach((sub: string) => s.add(sub));
      });
    }

    // Include subjects that teachers already have registered
    availabilities.forEach((t) => {
      if (t.subject) s.add(t.subject);
      if (t.subjects) t.subjects.forEach((sub) => s.add(sub));
    });
    return Array.from(s).sort();
  }, [availabilities, sector]);

  const filteredAvailabilities = availabilities.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.subjects && a.subjects.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Removed auto-selection

  const selectedTeacher = availabilities.find(a => a.id === selectedId);
  const dbDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const days = t.days;

  const handleEditClick = () => {
    if (selectedTeacher) {
      setTempSlots([...selectedTeacher.slots]);
      setTempName(selectedTeacher.name);
      setTempSubject(selectedTeacher.subject || '');
      setTempSubjects(selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? [...selectedTeacher.subjects] : (selectedTeacher.subject ? [selectedTeacher.subject] : []));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempSlots([]);
    setTempName('');
    setTempSubject('');
    setTempSubjects([]);
  };

  const handleSaveEdit = () => {
    if (selectedTeacher && onSaveTeacher) {
      const finalSubjects = tempSubjects.length > 0 ? tempSubjects : [tempSubject || 'General'];
      onSaveTeacher({
        ...selectedTeacher,
        name: tempName,
        subject: finalSubjects[0],
        subjects: finalSubjects,
        slots: tempSlots,
        timestamp: new Date()
      });
    }
    setIsEditing(false);
  };

  const handleDeleteTeacher = () => {
    if (selectedTeacher && onDeleteTeacher) {
      onDeleteTeacher(selectedTeacher.id);
      setSelectedId(null);
      setIsEditing(false);
    }
  };

  const handleToggleSlot = (day: string, hour: string) => {
    if (!isEditing) return;
    const slot = `${day}-${hour}`;
    setTempSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleAddTempSubject = (subjectStr: string) => {
    const trimmed = subjectStr.trim();
    if (!trimmed) return;
    if (!tempSubjects.includes(trimmed)) {
      setTempSubjects(prev => [...prev, trimmed]);
    }
  };

  const handleRemoveTempSubject = (subjectStr: string) => {
    setTempSubjects(prev => prev.filter(s => s !== subjectStr));
  };

  const handleAddNewTeacherSubject = (subjectStr: string) => {
    const trimmed = subjectStr.trim();
    if (!trimmed) return;
    if (!newTeacherSubjects.includes(trimmed)) {
      setNewTeacherSubjects(prev => [...prev, trimmed]);
    }
  };

  const handleRemoveNewTeacherSubject = (subjectStr: string) => {
    setNewTeacherSubjects(prev => prev.filter(s => s !== subjectStr));
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    const finalSubjectsArray = newTeacherSubjects.length > 0 
      ? newTeacherSubjects 
      : (newTeacherSubject ? [newTeacherSubject] : ['General']);

    const newId = `doc-${Date.now()}`;
    
    // Generate random slots (e.g., 60% probability of being available per cell)
    const randomSlots: string[] = [];
    const daysToUse = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    daysToUse.forEach(day => {
      hours.forEach(hour => {
        if (Math.random() < 0.6) {
          randomSlots.push(`${day}-${hour}`);
        }
      });
    });

    if (onSaveTeacher) {
      onSaveTeacher({
        id: newId,
        name: newTeacherName,
        subject: finalSubjectsArray[0],
        subjects: finalSubjectsArray,
        slots: randomSlots,
        timestamp: new Date(),
        sector: sector
      });
    }
    
    setNewTeacherName('');
    setNewTeacherSubject('');
    setNewTeacherSubjects([]);
    setShowAddModal(false);
    setSelectedId(newId);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsImporting(true);
    setImportProgress({ current: 0, total: 100 });
    setImportFileName(file.name);
    setImportStep(language === 'es' ? 'Inicializando cargador...' : 'Initializing loader...');
    setImportConsoleLogs([
      `[LOG] ${new Date().toLocaleTimeString()} - Iniciando carga de ${file.name}`,
      `[INFO] Peso del archivo: ${(file.size / 1024).toFixed(1)} KB`
    ]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("No se obtuvieron datos del archivo.");

        // Stage 1: Reading array buffer
        setImportStep(language === 'es' ? 'Leyendo libro de trabajo...' : 'Reading workbook structure...');
        setImportConsoleLogs(prev => [...prev, `[SISTEMA] Leyendo estructura binaria del archivo...`]);
        await new Promise(r => setTimeout(r, 600));

        const bytes = new Uint8Array(data as ArrayBuffer);
        const workbook = XLSX.read(bytes, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to structure
        const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (rawRows.length === 0) {
          showToast(language === 'es' ? 'El archivo está vacío o es inválido.' : 'The file is empty or invalid.', 'error');
          setIsImporting(false);
          return;
        }

        setImportConsoleLogs(prev => [...prev, 
          `[OK] Libro de Excel cargado. Hojas encontradas: ${workbook.SheetNames.join(', ')}`,
          `[ANÁLISIS] Seleccionada la primera hoja: "${sheetName}" con ${rawRows.length} filas totales.`
        ]);
        await new Promise(r => setTimeout(r, 700));

        // Stage 2: Column analysis and detection
        setImportStep(language === 'es' ? 'Analizando estructura de columnas...' : 'Analyzing column structural headers...');
        
        let headerRowIndex = 0;
        let nameColIndex = -1;
        let subjectColIndex = -1;
        let otherColumns: string[] = [];
        let foundHeader = false;

        const maxInspectionRows = Math.min(12, rawRows.length);
        for (let r = 0; r < maxInspectionRows; r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          let candidateNameIdx = -1;
          let candidateSubjectIdx = -1;
          let tempCols: string[] = [];

          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || "").trim();
            if (!cellVal) continue;
            
            tempCols.push(cellVal);
            const lowerCell = cellVal.toLowerCase();
            
            if (
              lowerCell === "nombre" || 
              lowerCell === "profesor" || 
              lowerCell === "docente" || 
              lowerCell === "maestro" || 
              lowerCell === "teacher" || 
              lowerCell === "name" || 
              lowerCell === "instructor" ||
              lowerCell.includes("nombre") ||
              lowerCell.includes("profesor") ||
              lowerCell.includes("maestro") ||
              lowerCell.includes("docente") ||
              lowerCell.includes("académ") ||
              lowerCell.includes("academ")
            ) {
              candidateNameIdx = c;
            } else if (
              lowerCell === "materia" || 
              lowerCell === "asignatura" || 
              lowerCell === "especialidad" || 
              lowerCell === "subject" || 
              lowerCell === "curso" || 
              lowerCell === "clase" ||
              lowerCell.includes("materia") ||
              lowerCell.includes("asignatura") ||
              lowerCell.includes("especialidad") ||
              lowerCell.includes("clase") ||
              lowerCell.includes("talleres") ||
              lowerCell.includes("clubes") ||
              lowerCell.includes("area") ||
              lowerCell.includes("unidad")
            ) {
              candidateSubjectIdx = c;
            }
          }

          if (candidateNameIdx !== -1) {
            headerRowIndex = r;
            nameColIndex = candidateNameIdx;
            subjectColIndex = candidateSubjectIdx !== -1 ? candidateSubjectIdx : -1;
            foundHeader = true;
            otherColumns = row.map(v => String(v || "").trim()).filter((val, idx) => val && idx !== nameColIndex && idx !== subjectColIndex);
            break;
          }
        }

        // Apply our AI-powered Smart Column Profiler to prevent mapping numbers/shorter codes as names!
        const numColumns = Math.max(...rawRows.map(r => Array.isArray(r) ? r.length : 0));
        const colProfiles = Array.from({ length: numColumns }, (_, colIdx) => {
          let totalCount = 0;
          let numericCount = 0;
          let emptyCount = 0;
          let hasLettersCount = 0;
          let multiWordCount = 0;
          let lengthSum = 0;

          // inspect first 50 rows
          const profileLimit = Math.min(50, rawRows.length);
          for (let r = 0; r < profileLimit; r++) {
            const row = rawRows[r];
            if (!Array.isArray(row) || row.length <= colIdx) {
              emptyCount++;
              continue;
            }
            const val = String(row[colIdx] || "").trim();
            if (!val) {
              emptyCount++;
              continue;
            }
            
            // Skip the header row itself for data profiling
            if (foundHeader && r === headerRowIndex) continue;

            totalCount++;
            lengthSum += val.length;
            
            // Clean value for numeric checks (e.g. "1.", "2)")
            const cleanVal = val.replace(/[\.\)\-]/g, '').trim();
            if (cleanVal && !isNaN(Number(cleanVal))) {
              numericCount++;
            }
            if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(val)) {
              hasLettersCount++;
            }
            if (val.split(/\s+/).length > 1) {
              multiWordCount++;
            }
          }

          const avgLength = totalCount > 0 ? lengthSum / totalCount : 0;

          return {
            colIdx,
            totalCount,
            numericCount,
            emptyCount,
            hasLettersCount,
            multiWordCount,
            avgLength
          };
        });

        // 1. Calculate best name column index
        let bestNameCol = nameColIndex;
        let bestNameScore = -1000;

        colProfiles.forEach(profile => {
          if (profile.totalCount === 0) return;
          
          let score = 0;
          
          // Name should contain alphabet letters
          const letterRatio = profile.hasLettersCount / profile.totalCount;
          score += letterRatio * 150;

          // Name should NOT contain mostly numbers
          const numericRatio = profile.numericCount / profile.totalCount;
          score -= numericRatio * 300; // heavy penalty for IDs / numbering column

          // Name column often has multi-words (First + Last Name)
          const multiWordRatio = profile.multiWordCount / profile.totalCount;
          score += multiWordRatio * 60;

          // Name length average is usually between 8 and 35 characters
          if (profile.avgLength >= 7 && profile.avgLength <= 35) {
            score += 40;
          } else if (profile.avgLength > 35 && profile.avgLength <= 60) {
            score += 15;
          }

          // Large bonus if matched the explicit header inspection
          if (foundHeader && nameColIndex === profile.colIdx) {
            score += 500;
          }

          if (score > bestNameScore) {
            bestNameScore = score;
            bestNameCol = profile.colIdx;
          }
        });

        // 2. Calculate best subject column index
        let bestSubjectCol = subjectColIndex;
        let bestSubjectScore = -1000;

        colProfiles.forEach(profile => {
          if (profile.colIdx === bestNameCol) return; // subject cannot be name!
          if (profile.totalCount === 0) return;

          let score = 0;

          // Subject should contain letters
          const letterRatio = profile.hasLettersCount / profile.totalCount;
          score += letterRatio * 100;

          // Subject should NOT contain mostly numbers
          const numericRatio = profile.numericCount / profile.totalCount;
          score -= numericRatio * 200;

          // Subject average length usually between 4 and 60 characters
          if (profile.avgLength >= 4 && profile.avgLength <= 60) {
            score += 30;
          }

          // Bonus if matched header inspection
          if (foundHeader && subjectColIndex === profile.colIdx) {
            score += 400;
          }

          if (score > bestSubjectScore) {
            bestSubjectScore = score;
            bestSubjectCol = profile.colIdx;
          }
        });

        // Overwrite or select matched column indices
        if (bestNameCol !== -1) {
          nameColIndex = bestNameCol;
        } else {
          nameColIndex = 0;
        }

        if (bestSubjectCol !== -1) {
          subjectColIndex = bestSubjectCol;
        } else {
          subjectColIndex = nameColIndex === 0 ? 1 : 0;
        }

        // Re-read header info if available for logs
        const finalHeaderRow = foundHeader ? headerRowIndex : 0;
        const nameHeaderName = rawRows[finalHeaderRow] ? String(rawRows[finalHeaderRow][nameColIndex] || "N/A") : "Columna " + (nameColIndex + 1);
        const subjectHeaderName = rawRows[finalHeaderRow] ? String(rawRows[finalHeaderRow][subjectColIndex] || "N/A") : "Columna " + (subjectColIndex + 1);

        setImportConsoleLogs(prev => [...prev, 
          `[LOG] Columnas analizadas estadísticamente:`,
          ...colProfiles.map(p => `  -> Columna ${p.colIdx + 1}: Letras ${p.totalCount ? Math.round((p.hasLettersCount/p.totalCount)*100) : 0}% | Números ${p.totalCount ? Math.round((p.numericCount/p.totalCount)*100) : 0}% | Longitud prom ${Math.round(p.avgLength)}`),
          `[SELECCIÓN] Mapeando Nombre de Docente a: "${nameHeaderName}" (Índice ${nameColIndex + 1})`,
          `[SELECCIÓN] Mapeando Especialidad a: "${subjectHeaderName}" (Índice ${subjectColIndex + 1})`
        ]);

        await new Promise(r => setTimeout(r, 1000));

        // Stage 3: Parse and generate
        const startRow = foundHeader ? headerRowIndex + 1 : 0;
        const totalRowsToProcess = rawRows.length - startRow;
        
        setImportStep(language === 'es' ? 'Importando y guardando docentes...' : 'Importing and persisting academic staff...');
        
        let importedCount = 0;
        
        for (let i = startRow; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;

          let name = String(row[nameColIndex] || "").trim();
          let rawSubject = String(row[subjectColIndex] || "General").trim();

          // Skip if empty, or matches typical headers or is purely numeric
          if (!name || name.toLowerCase() === "nombre" || name.toLowerCase() === "profesor" || name.toLowerCase().includes("docente")) {
            continue;
          }

          // Defensive checks: skip if name is purely numeric index (e.g. "1", "2") or too short
          const cleanNameCheck = name.replace(/[\.\d]/g, "").trim();
          if (!cleanNameCheck || cleanNameCheck.length < 2 || !isNaN(Number(name))) {
            continue;
          }

          // Process multi-value fields for subjects if present (split by comma, semicolon or slash)
          const subjectsArray = rawSubject
            .split(/[,;/+]+/)
            .map(s => s.trim())
            .filter(Boolean);

          // Filter topics based on active school tier (Sector)
          const filteredSubjectsArray = subjectsArray.filter(sub => subjectBelongsToSector(sub, sector));

          if (filteredSubjectsArray.length === 0) {
            // Log filtration activity on the stream console
            setImportConsoleLogs(prev => [
              ...prev.slice(-15),
              `[FILTRADO] Saltando docente "${name}" - Ninguna de sus materias ([${subjectsArray.join(', ')}]) pertenece al sector ${sector === Sector.PREPARATORY ? 'Preparatoria' : 'Secundaria'}.`
            ]);
            continue;
          }

          const mainSubject = filteredSubjectsArray[0] || "General";

          // Detailed analysis logs
          setImportConsoleLogs(prev => [
            ...prev.slice(-15), // keep last 15 items to avoid memory/flicker overload
            `[PROCESANDO] ${name} | Especialidades del sector: [${filteredSubjectsArray.join(', ')}]`
          ]);

          // Build random availability slots Lunes - Viernes (e.g., 60% probability) as requested by user
          const slots: string[] = [];
          const daysToUse = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
          daysToUse.forEach(day => {
            hours.forEach(hour => {
              if (Math.random() < 0.6) {
                slots.push(`${day}-${hour}`);
              }
            });
          });

          const newId = `imported-${Date.now()}-${i}`;
          const importedTeacher: TeacherAvailability = {
            id: newId,
            name,
            subject: mainSubject,
            subjects: filteredSubjectsArray,
            slots,
            timestamp: new Date(),
            sector: sector
          };

          if (onSaveTeacher) {
            await onSaveTeacher(importedTeacher);
            importedCount++;
          }

          setImportProgress({ current: i - startRow + 1, total: Math.max(1, totalRowsToProcess) });
          // Sleep slightly to let React render and satisfy user's want for non-freezing feeling
          await new Promise(res => setTimeout(res, 80));
        }

        setImportStep(language === 'es' ? 'Sincronización finalizada!' : 'Sync complete!');
        setImportConsoleLogs(prev => [
          ...prev, 
          `[FIN] Procesamiento terminado de manera exitosa.`,
          `[TOTAL] ${importedCount} docentes guardados en Firestore.`
        ]);
        await new Promise(r => setTimeout(r, 600));

        showToast(t.importSuccess.replace('{count}', String(importedCount)), 'success');
        setShowAddModal(false);
      } catch (err) {
        console.error("Error al importar Excel:", err);
        showToast(t.importError, 'error');
      } finally {
        setIsImporting(false);
        setImportProgress(null);
        if (e.target) e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const displayedSlots = isEditing ? tempSlots : (selectedTeacher?.slots || []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 h-full flex flex-col pb-10 relative">
      {/* Immersive Futuristic Excel parsing Analyzer */}
      {isImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-xl rounded-[2.5rem] p-8 border shadow-2xl transition-all relative overflow-hidden ${
            isDarkMode ? 'bg-gray-905 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Ambient Background Glow */}
            <div className={`absolute -right-20 -top-20 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl animate-pulse`} />
            <div className={`absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-sky-500/10 blur-3xl`} />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner relative">
                  <span className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-ping opacity-75" />
                  <FileSpreadsheet size={28} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black tracking-tight">{language === 'es' ? 'Analizador Inteligente de Excel' : 'Smart Excel Parser'}</h3>
                  <p className="text-xs text-gray-400 font-semibold truncate max-w-[280px]">
                    {language === 'es' ? 'Archivo:' : 'File:'} <span className="text-emerald-500 font-bold">{importFileName}</span>
                  </p>
                </div>
              </div>

              {/* Step Notification Banner */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isDarkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-black tracking-wider text-emerald-500">
                    {language === 'es' ? 'ESTADO DE ANÁLISIS' : 'PARSING STATUS'}
                  </p>
                  <p className="text-xs font-bold text-gray-500 truncate mt-0.5">{importStep}</p>
                </div>
              </div>

              {/* Progress representation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400">
                    {language === 'es' ? 'Progreso de Sincronización' : 'Schedules Sync Progress'}
                  </span>
                  <span className="font-bold text-emerald-500">
                    {importProgress ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
                  </span>
                </div>
                
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border dark:border-gray-700">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 relative"
                    style={{ width: `${importProgress ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                  <span>{language === 'es' ? 'Analizando registros...' : 'Scanning rows...'}</span>
                  <span>{importProgress ? `${importProgress.current} ${language === 'es' ? 'de' : 'of'} ${importProgress.total}` : ''}</span>
                </div>
              </div>

              {/* Real-time Telemetry Logs box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {language === 'es' ? 'Servicio de Telemetría Excel' : 'Excel Telemetry Stream'}
                </label>
                <div className="w-full h-36 rounded-2xl bg-gray-950 border border-gray-800 p-4 font-mono text-[9px] text-emerald-400/90 overflow-y-auto flex flex-col gap-1.5 custom-scrollbar shadow-inner select-text">
                  {importConsoleLogs.map((log, index) => {
                    let color = "text-emerald-400/90";
                    if (log.includes("[ADVERTENCIA]")) color = "text-amber-400";
                    if (log.includes("[ÉXITO]") || log.includes("[OK]")) color = "text-emerald-300 font-bold";
                    if (log.includes("[INFO]")) color = "text-sky-300";
                    if (log.includes("[PROCESANDO]")) color = "text-gray-400";
                    
                    return (
                      <div key={index} className={`${color} leading-relaxed break-all`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spinner & Safety advice */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[9px] text-gray-500 max-w-[340px] leading-relaxed">
                  ⚠️ {language === 'es' 
                    ? 'No cierres esta pestaña ni desconectes el internet para evitar duplicados en Firestore.' 
                    : 'Do not close this tab or disconnect to prevent duplicate entries in Firestore.'
                  }
                </p>
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.title}</h2>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        
        <div className={`p-2 rounded-xl bg-${vibrant}/10 text-${vibrant} flex items-center gap-2 border border-${vibrant}/20`}>
          <LayoutList size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest px-2">{t.adminPanel}</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden relative">
        {/* Sidebar: Teacher Grid */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="relative mb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder={t.filterPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border transition-all text-xs focus:outline-none focus:border-${vibrant} ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200'}`}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className={`p-3 rounded-2xl shrink-0 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 bg-${vibrant} hover:bg-${themeColor}-600 border-2 border-transparent`}
              title={t.addTeacherTitle}
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const fileInput = document.getElementById('excel-file-upload');
                if (fileInput) fileInput.click();
              }}
              disabled={isImporting}
              className={`py-3 px-2 rounded-xl font-bold text-[8.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all border border-dashed duration-300 ${
                isDarkMode 
                   ? `bg-emerald-500/5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10` 
                  : `bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100`
              }`}
              title={t.importExcel}
            >
              {isImporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin whitespace-nowrap" />
                  <span className="truncate">
                    {importProgress ? `${importProgress.current}/${importProgress.total}` : '...'}
                  </span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={12} className="shrink-0 text-emerald-500" />
                  <span className="truncate">{t.importExcel}</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportExcel}
              className={`py-3 px-2 rounded-xl font-bold text-[8.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all border border-dashed duration-300 ${
                isDarkMode 
                   ? `bg-sky-500/5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10` 
                  : `bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100`
              }`}
              title={t.exportExcel}
            >
              <FileSpreadsheet size={12} className="shrink-0 text-sky-500" />
              <span className="truncate">{t.exportExcel}</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className={`py-3 px-2 rounded-xl font-bold text-[8.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all border border-dashed duration-300 ${
                isDarkMode 
                   ? `bg-indigo-500/5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10` 
                  : `bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100`
              } ${localRefreshing ? 'opacity-80 scale-95' : ''}`}
              title={language === 'es' ? 'Recargar Sistema' : 'Reload System'}
              disabled={localRefreshing}
            >
              <RefreshCw size={12} className={`shrink-0 text-indigo-500 ${localRefreshing ? 'animate-spin' : ''}`} />
              <span className="truncate">{localRefreshing ? (language === 'es' ? 'Cargando...' : 'Loading...') : (language === 'es' ? 'Actualizar' : 'Refresh')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRandomizeAvailabilities}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-[9px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all border border-dashed duration-300 ${
              isDarkMode 
                 ? `bg-amber-500/5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10` 
                : `bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100`
            }`}
          >
            <Shuffle size={12} className="text-amber-500 shrink-0" />
            <span>{language === 'es' ? 'Generar Disponibilidad Aleatoria' : 'Generate Random Availability'}</span>
          </button>

          {/* Multi-Selection control bar */}
          {filteredAvailabilities.length > 0 && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
              isDarkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const allVisibleIds = filteredAvailabilities.map(t => t.id);
                    const allChecked = allVisibleIds.every(id => checkedTeacherIds.includes(id));
                    if (allChecked) {
                      // Deselect all visible
                      setCheckedTeacherIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                    } else {
                      // Select all visible (keeping previous ones)
                      setCheckedTeacherIds(prev => {
                        const union = new Set([...prev, ...allVisibleIds]);
                        return Array.from(union);
                      });
                    }
                  }}
                  className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${
                    filteredAvailabilities.every(t => checkedTeacherIds.includes(t.id))
                      ? `bg-${vibrant} text-white border-transparent`
                      : `${isDarkMode ? 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950'}`
                  }`}
                >
                  {filteredAvailabilities.every(t => checkedTeacherIds.includes(t.id))
                    ? (language === 'es' ? 'Desmarcar todos' : 'Deselect all')
                    : (language === 'es' ? 'Marcar todos' : 'Select all')
                  }
                </button>

                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {checkedTeacherIds.length} {language === 'es' ? 'de' : 'of'} {filteredAvailabilities.length}
                </span>
              </div>

              {checkedTeacherIds.length > 0 && (
                <button
                  type="button"
                  disabled={isDeletingSelected}
                  onClick={() => setShowConfirmDeleteModal(true)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all bg-rose-600 hover:bg-rose-750 text-white shadow-rose-950/10`}
                >
                  <Trash2 size={13} />
                  <span>{language === 'es' ? `Eliminar Seleccionados` : `Delete Selected`}</span>
                </button>
              )}
            </div>
          )}

          {filteredAvailabilities.length === 0 ? (
            <div className={`p-8 rounded-[2rem] border-2 border-dashed text-center flex flex-col items-center justify-center gap-3 ${isDarkMode ? 'border-gray-800 text-gray-600' : 'border-slate-200 text-slate-400'}`}>
              <Users size={32} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">{t.noData}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAvailabilities.map((teacher) => {
                const teacherTheme = getTeacherTheme(teacher.id);
                const isSelected = selectedId === teacher.id;
                const isChecked = checkedTeacherIds.includes(teacher.id);
                
                const cardStyles = isSelected
                  ? `${teacherTheme.selectedBg} ${teacherTheme.selectedBorder} ${teacherTheme.selectedText} shadow-xl ${teacherTheme.selectedShadow} scale-[1.02]`
                  : isDarkMode
                    ? `${teacherTheme.darkBg} ${teacherTheme.darkBorder} ${teacherTheme.darkText} ${teacherTheme.darkHoverBorder} ${teacherTheme.darkHoverBg}`
                    : `${teacherTheme.lightBg} ${teacherTheme.lightBorder} ${teacherTheme.lightText} ${teacherTheme.lightHoverBorder} ${teacherTheme.lightHoverBg}`;

                const initialsStyles = isSelected
                  ? 'bg-white/20 text-white'
                  : isDarkMode
                    ? `${teacherTheme.darkInitialsBg} ${teacherTheme.darkInitialsText}`
                    : `${teacherTheme.lightInitialsBg} ${teacherTheme.lightInitialsText}`;

                const subtitleStyles = isSelected
                  ? 'text-white/70'
                  : 'text-gray-500';

                return (
                  <div
                    key={teacher.id}
                    onClick={() => {
                      if (!isEditing && !isDeletingSelected) setSelectedId(teacher.id);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all group relative overflow-hidden cursor-pointer ${cardStyles} ${
                      (isEditing && !isSelected) || isDeletingSelected ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10 w-full">
                      {/* Interactive Selection Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isChecked) {
                            setCheckedTeacherIds(prev => prev.filter(id => id !== teacher.id));
                          } else {
                            setCheckedTeacherIds(prev => [...prev, teacher.id]);
                          }
                        }}
                        disabled={isEditing || isDeletingSelected}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? `${isSelected ? 'bg-white border-white text-rose-600 scale-110' : 'bg-rose-500 border-rose-500 text-white scale-110 shadow-sm'}`
                            : `${isDarkMode ? 'border-gray-700 bg-gray-950/30 hover:border-gray-500' : 'border-slate-300 bg-white hover:border-slate-450'}`
                        }`}
                      >
                        {isChecked && (
                          <Check size={11} strokeWidth={4} />
                        )}
                      </button>

                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors shrink-0 ${initialsStyles}`}>
                        {teacher.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate uppercase tracking-tight">{teacher.name}</h4>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 truncate ${subtitleStyles}`}>
                          {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : (teacher.subject || 'General')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content: Graphical Preview */}
        <div className={`lg:col-span-3 border rounded-[2.5rem] overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
          {selectedTeacher ? (
            <>
              <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isDarkMode ? 'border-gray-800 bg-gray-950/40' : 'border-slate-50 bg-slate-50/50'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 shrink-0 rounded-3xl bg-${vibrant} text-white flex items-center justify-center shadow-lg shadow-${themeColor}-900/30`}>
                    <Users size={32} />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className={`text-2xl font-black tracking-tight px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-${vibrant}/50 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white border text-slate-900 border-slate-200'}`}
                        />
                        
                        {/* Interactive edit subject tags */}
                        <div className="space-y-2.5 mt-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block">
                              {t.subjectsListLabel}
                            </span>
                            <span className="text-[9px] font-medium text-amber-500/90 leading-normal block">
                              {t.unlimitedSubjectsHelp}
                            </span>
                          </div>
                          
                          {/* Rich Tag Container */}
                          <div className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-wrap gap-2 ${isDarkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                            {tempSubjects.length === 0 ? (
                              <div className="flex items-center gap-2 p-1 text-gray-400 dark:text-gray-500 italic text-xs">
                                <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse`} />
                                {t.noSubjectsWarning}
                              </div>
                            ) : (
                              tempSubjects.map(sub => (
                                <span 
                                  key={sub} 
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 ${
                                    isDarkMode 
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                                      : 'bg-blue-50/70 border border-blue-100 text-blue-700 hover:bg-blue-100'
                                  }`}
                                >
                                  <span>{sub}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveTempSubject(sub)}
                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all focus:outline-none hover:scale-110 ${
                                      isDarkMode 
                                        ? 'bg-blue-500/20 hover:bg-red-500/20 hover:text-red-400 text-blue-400' 
                                        : 'bg-blue-100 hover:bg-red-100 hover:text-red-650 text-blue-700'
                                    }`}
                                  >
                                    <X size={10} strokeWidth={3} />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder={t.subjectPlaceholder}
                              list="subjects-list"
                              id="edit-temp-subject-input-element"
                              className={`flex-grow text-xs font-bold px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-${vibrant}/10 transition-all ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' : 'bg-white border border-slate-200 text-slate-900 shadow-sm'}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const val = input.value.trim();
                                  if (val) {
                                    handleAddTempSubject(val);
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('edit-temp-subject-input-element') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handleAddTempSubject(input.value.trim());
                                  input.value = '';
                                }
                              }}
                              className={`px-5 py-3 text-xs font-black uppercase rounded-2xl text-white transition-all shadow-md active:scale-95 bg-${vibrant} hover:brightness-105`}
                            >
                              {t.addSubjectBtn}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedTeacher.name}</h3>
                        <div className="flex flex-col gap-3 mt-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                              <MapPin size={14} className={`text-${vibrant}`} />
                              {t.subjectsListLabel}:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? (
                                selectedTeacher.subjects.map(s => (
                                  <span key={s} className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-700'}`}>
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-700'}`}>
                                  {selectedTeacher.subject || t.generalSubject}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Calendar size={12} />
                            {t.lastUpdated} {new Date(selectedTeacher.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 justify-end">
                  <div className="flex flex-col items-end pr-4 md:border-r border-gray-200 dark:border-gray-800 shrink-0">
                    <div className={`text-3xl font-black tracking-tighter text-${vibrant}`}>
                      {displayedSlots.length}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t.hoursCount}</span>
                  </div>
                  
                  {(() => {
                    const allPossibleSlots = dbDays.flatMap(day => hours.map(hour => `${day}-${hour}`));
                    const isAllSelected = selectedTeacher ? allPossibleSlots.every(slot => selectedTeacher.slots.includes(slot)) : false;
                    const isTempAllSelected = allPossibleSlots.every(slot => tempSlots.includes(slot));
                    
                    return isEditing ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          onClick={handleCancelEdit}
                          className={`p-2.5 md:p-3 rounded-2xl border-2 font-bold text-xs flex items-center gap-2 transition-colors ${isDarkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          <X size={16} />
                          <span className="hidden sm:inline">{t.cancel}</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            const newTempSlots = isTempAllSelected ? [] : allPossibleSlots;
                            setTempSlots(newTempSlots);
                            showToast(
                              isTempAllSelected 
                                ? (language === 'es' ? 'Disponibilidad borrada en borrador' : 'Draft availability cleared')
                                : (language === 'es' ? 'Toda la disponibilidad marcada en borrador' : 'All draft availability marked'),
                              'success'
                            );
                          }}
                          className={`p-2.5 md:p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                            isTempAllSelected 
                              ? `bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-750` 
                              : `${isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-850' : 'border-slate-200 text-slate-755 hover:bg-slate-100'}`
                          }`}
                          title={isTempAllSelected 
                            ? (language === 'es' ? 'Desmarcar todo' : 'Deselect all')
                            : (language === 'es' ? 'Marcar todo' : 'Select all')
                          }
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isTempAllSelected 
                              ? 'bg-white border-white text-emerald-600' 
                              : `${isDarkMode ? 'border-gray-500 bg-gray-900' : 'border-slate-400 bg-white'}`
                          }`}>
                            {isTempAllSelected && <Check size={12} className="text-emerald-600 font-bold" />}
                          </div>
                          <span className="hidden sm:inline">
                            {isTempAllSelected 
                              ? (language === 'es' ? 'Desmarcar todo' : 'Deselect all')
                              : (language === 'es' ? 'Marcar todo' : 'Select all')
                            }
                          </span>
                        </button>

                        <button 
                          onClick={handleSaveEdit}
                          className={`p-2.5 md:p-3 rounded-2xl font-bold text-xs flex items-center gap-2 text-white transition-transform hover:scale-105 active:scale-95 bg-${vibrant}`}
                        >
                          <Save size={16} />
                          <span className="hidden sm:inline">{t.saveChanges}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button 
                          onClick={handleDeleteTeacher}
                          className={`p-2.5 md:p-3 rounded-2xl border-2 font-bold text-xs flex items-center gap-2 transition-colors ${isDarkMode ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 'border-red-100 text-red-500 hover:bg-red-50'}`}
                          title={t.deleteTeacher}
                        >
                          <Trash2 size={16} />
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            if (!selectedTeacher || !onSaveTeacher) return;
                            const newSlots = isAllSelected ? [] : allPossibleSlots;
                            onSaveTeacher({
                              ...selectedTeacher,
                              slots: newSlots,
                              timestamp: new Date()
                            });
                            showToast(
                              isAllSelected 
                                ? (language === 'es' ? 'Disponibilidad limpiada por completo' : 'Availability fully cleared')
                                : (language === 'es' ? 'Toda la disponibilidad seleccionada' : 'All availability selected'),
                              'success'
                            );
                          }}
                          className={`p-2.5 md:p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                            isAllSelected 
                              ? `bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-750` 
                              : `${isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-850' : 'border-slate-200 text-slate-755 hover:bg-slate-100'}`
                          }`}
                          title={isAllSelected 
                            ? (language === 'es' ? 'Desmarcar todo' : 'Deselect all')
                            : (language === 'es' ? 'Marcar todo' : 'Select all')
                          }
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isAllSelected 
                              ? 'bg-white border-white text-emerald-600' 
                              : `${isDarkMode ? 'border-gray-500 bg-gray-900' : 'border-slate-400 bg-white'}`
                          }`}>
                            {isAllSelected && <Check size={12} className="text-emerald-600 font-bold" />}
                          </div>
                          <span className="hidden sm:inline">
                            {isAllSelected 
                              ? (language === 'es' ? 'Desmarcar todo' : 'Deselect all')
                              : (language === 'es' ? 'Marcar todo' : 'Select all')
                            }
                          </span>
                        </button>

                        <button 
                          onClick={handleEditClick}
                          className={`p-2.5 md:p-3 rounded-2xl border-2 font-bold text-xs flex items-center gap-2 transition-colors ${isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                        >
                          <Edit3 size={16} />
                          <span className="hidden sm:inline">{t.editAvailability}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
                <div className="min-w-[700px] lg:min-w-full">
                  <table className="w-full border-separate border-spacing-3">
                    <thead>
                      <tr>
                        <th className="p-2 w-24"></th>
                        {dbDays.map((d, index) => (
                          <th key={d} className="p-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">{t.days[index]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hours.map(hour => (
                        <tr key={hour}>
                          <td className="p-2 text-[11px] font-black text-gray-500 text-right pr-6">{hour}</td>
                          {dbDays.map(day => {
                            const isAvailable = displayedSlots.includes(`${day}-${hour}`);
                            return (
                              <td 
                                key={`${day}-${hour}`}
                                onClick={() => handleToggleSlot(day, hour)}
                                className={`h-16 rounded-[1.25rem] border-2 transition-all duration-300 select-none ${
                                  isEditing ? 'cursor-pointer hover:border-blue-400' : ''
                                } ${
                                  isAvailable 
                                    ? `bg-${vibrant} border-${vibrant} shadow-xl shadow-${themeColor}-900/20 scale-100` 
                                    : `${isDarkMode ? 'bg-gray-800/20 border-gray-800/40' : 'bg-slate-50 border-slate-100'} scale-95 opacity-40 hover:opacity-100`
                                }`}
                              >
                                <div className="flex items-center justify-center h-full w-full">
                                  {isAvailable ? (
                                    <CheckCircle2 size={20} className="text-white animate-in zoom-in" />
                                  ) : (
                                    isEditing && <div className="w-2 h-2 rounded-full bg-gray-300/50"></div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className={`p-6 border-t text-center ${isDarkMode ? 'border-gray-800 bg-gray-950/20' : 'border-slate-50 bg-slate-50/20'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
                  {isEditing ? t.clickHelp : t.title}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className={`w-32 h-32 rounded-full bg-${vibrant}/5 flex items-center justify-center mb-8`}>
                <Users size={64} className="text-gray-400 opacity-20" />
              </div>
              <h3 className={`text-2xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.viewerTitle}</h3>
              <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
                {t.selectTeacherMsg}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${vibrant}/10 text-${vibrant} flex items-center justify-center`}>
                  <Users size={20} />
                </div>
                <h3 className="font-black text-lg">{t.addTeacherTitle}</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-850 text-gray-400' : 'hover:bg-slate-100 text-gray-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div className={`p-5 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                isDarkMode ? 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/40 border-emerald-200 text-emerald-700'
              }`}>
                <FileSpreadsheet size={24} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.excelBannerTitle}</span>
                <p className="text-[9px] text-gray-500 max-w-[240px]">{t.excelBannerDesc}</p>
                <button
                  type="button"
                  onClick={() => {
                    const fileInput = document.getElementById('excel-file-upload');
                    if (fileInput) fileInput.click();
                  }}
                  disabled={isImporting}
                  className={`mt-1 py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider text-white transition-all shadow-md bg-emerald-500 hover:bg-emerald-600`}
                >
                  {isImporting ? t.importing : t.searchFile}
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink mx-3 text-[9px] font-black uppercase tracking-widest text-gray-400">{t.orManual}</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.fullName}</label>
                <input 
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Ej. Lic. María López"
                  autoFocus
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:border-${vibrant} focus:ring-4 focus:ring-${vibrant}/10 font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white/90 placeholder-gray-500' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.subjectsListLabel}</label>
                  <span className="text-[9px] font-medium text-amber-500/90 leading-normal block">
                    {t.unlimitedSubjectsHelp}
                  </span>
                </div>
                
                {/* Visual Tags array */}
                <div className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-wrap gap-2 ${isDarkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                  {newTeacherSubjects.length === 0 ? (
                    <div className="flex items-center gap-2 p-1 text-gray-400 dark:text-gray-500 italic text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse`} />
                      {t.noSubjectsWarning}
                    </div>
                  ) : (
                    newTeacherSubjects.map(sub => (
                      <span 
                        key={sub} 
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 ${
                          isDarkMode 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                            : 'bg-blue-50/70 border border-blue-100 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <span>{sub}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveNewTeacherSubject(sub)}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all focus:outline-none hover:scale-110 ${
                            isDarkMode 
                              ? 'bg-blue-500/20 hover:bg-red-500/20 hover:text-red-400 text-blue-400' 
                              : 'bg-blue-100 hover:bg-red-100 hover:text-red-650 text-blue-700'
                          }`}
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    id="new-teacher-subject-input-element"
                    list="subjects-list"
                    placeholder={t.subjectPlaceholder}
                    className={`flex-grow px-5 py-4 rounded-2xl border-2 transition-all focus:border-${vibrant} focus:ring-4 focus:ring-${vibrant}/10 font-bold text-xs ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val) {
                          handleAddNewTeacherSubject(val);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-teacher-subject-input-element') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddNewTeacherSubject(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className={`px-5 py-4 text-xs font-black uppercase rounded-2xl text-white transition-all shadow-md active:scale-95 bg-${vibrant} hover:brightness-105`}
                  >
                    {t.addSubjectBtn}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 p-4 rounded-2xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className={`flex-1 p-4 rounded-2xl font-bold text-sm text-white transition-colors bg-${vibrant} hover:bg-${themeColor}-600 shadow-xl shadow-${themeColor}-900/20 flex items-center justify-center gap-2`}
                >
                  <Plus size={18} />
                  {t.createTeacher}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <datalist id="subjects-list">
        {allSubjects.map(sub => (
          <option key={sub} value={sub} />
        ))}
      </datalist>

      <input 
        id="excel-file-upload"
        type="file" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleExcelImport}
        className="hidden"
      />

      {/* Custom Confirmation Modal */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[2rem] p-7 border shadow-2xl transition-all relative overflow-hidden ${
            isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner">
                  <Trash2 size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {language === 'es' ? '¿Confirmar eliminación?' : 'Confirm elimination?'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {language === 'es' ? 'Esta acción es irreversible' : 'This action is irreversible'}
                  </p>
                </div>
              </div>

              <p className="text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-300">
                {language === 'es' 
                  ? `¿Estás seguro de que deseas eliminar permanentemente a los ${checkedTeacherIds.length} profesores seleccionados de la base de datos de Firestore?` 
                  : `Are you sure you want to permanently delete the ${checkedTeacherIds.length} selected teachers from the Firestore database?`}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingSelected}
                  onClick={() => setShowConfirmDeleteModal(false)}
                  className={`flex-grow p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors ${
                    isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeletingSelected}
                  onClick={async () => {
                    if (!onDeleteTeacher) return;
                    try {
                      setIsDeletingSelected(true);
                      // Delete each selected teacher sequentially to update Firestore properly
                      for (const id of checkedTeacherIds) {
                        await onDeleteTeacher(id);
                      }
                      
                      // Show custom toast notification instead of alert popup
                      showToast(
                        language === 'es' 
                          ? `${checkedTeacherIds.length} profesores eliminados de la base de datos.` 
                          : `${checkedTeacherIds.length} teachers deleted from database.`,
                        'success'
                      );
                      
                      if (selectedId && checkedTeacherIds.includes(selectedId)) {
                        setSelectedId(null);
                        setIsEditing(false);
                      }
                      setCheckedTeacherIds([]);
                      setShowConfirmDeleteModal(false);
                    } catch (error) {
                      console.error("Bulk delete error:", error);
                      showToast(
                        language === 'es' 
                          ? 'Error al eliminar profesores. Intente de nuevo.' 
                          : 'Error deleting teachers. Please try again.',
                        'error'
                      );
                    } finally {
                      setIsDeletingSelected(false);
                    }
                  }}
                  className={`flex-grow p-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white transition-all bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2`}
                >
                  {isDeletingSelected ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'es' ? 'Eliminando...' : 'Deleting...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>{language === 'es' ? 'Eliminar' : 'Delete'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Alert Banners */}
      {customToast && (
        <div className="fixed top-6 right-6 z-[120] flex flex-col gap-2 pointer-events-none animate-in slide-in-from-top-4 duration-350">
          <div className={`p-4 rounded-3xl border shadow-xl flex items-center gap-3 max-w-sm pointer-events-auto backdrop-blur-md ${
            customToast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : customToast.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              customToast.type === 'success' 
                ? 'bg-emerald-500/25 text-emerald-300' 
                : customToast.type === 'error'
                  ? 'bg-rose-500/25 text-rose-300'
                  : 'bg-indigo-500/25 text-indigo-300'
            }`}>
              {customToast.type === 'success' ? <Check size={14} strokeWidth={3} /> : <Trash2 size={14} />}
            </div>
            <p className="text-xs font-bold leading-relaxed">{customToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

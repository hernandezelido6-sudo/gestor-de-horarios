
export enum Sector {
  PREPARATORY = 'Preparatoria',
  SECONDARY = 'Secundaria'
}

export enum NavItem {
  INICIO = 'Inicio',
  HORARIOS = 'Horarios',
  DISPONIBILIDAD = 'Disponibilidad',
  PROTOTIPO = 'Prototipo',
  PROFESORES = 'Profesores',
  COMUNIDAD = 'Comunidad',
  HORARIO_GENERAL = 'Horario General',
  COMPARTIR = 'Compartir',
  AJUSTES = 'Ajustes',
  AUTOCORRECTOR = 'Autocorrector'
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  sector: Sector;
  avatar?: string;
}

export interface TeacherAvailability {
  id: string;
  name: string;
  subject?: string;
  subjects?: string[];
  slots: string[]; // Store as "Day-Hour" strings
  timestamp: Date;
  sector?: Sector;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOfficial?: boolean;
}

export type Language = 'es' | 'en';
export type FontSize = 'small' | 'normal' | 'large';

export interface User {
  id: string;
  name: string;
  subject?: string;
  subjects?: string[];
  sector: Sector;
  role: string;
}

export interface ClassData {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  hour: string;
  sector: Sector;
  group: string;
}

export interface SystemSettings {
  hours: string[];
  recesses?: string[];
  hoursPreparatory?: string[];
  recessesPreparatory?: string[];
  hoursSecondary?: string[];
  recessesSecondary?: string[];
}

export interface AppState {
  sector: Sector;
  currentNav: NavItem;
  themeColor: string;
  isDarkMode: boolean;
  language: Language;
  fontSize: FontSize;
  currentUser: User | null;
  selectedRoom: string;
  settings: SystemSettings;
}


import React, { useState } from 'react';
import { Plus, List, Calendar, Download, Trash2, X, MapPin, Book, AlertCircle, CheckCircle2, Search, Pencil, Save, Check, Coffee, RefreshCw } from 'lucide-react';
import { Sector, User, ClassData, TeacherAvailability, AppState, Language } from '../types';
import { PREPARATORY_ROOMS, SECONDARY_ROOMS } from '../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SchedulerProps {
  sector: Sector;
  themeColor: string;
  isDarkMode: boolean;
  currentUser: User | null;
  allClasses: ClassData[];
  onUpdateClasses: (classes: ClassData[]) => void;
  availabilities: TeacherAvailability[];
  selectedRoom?: string;
  onRoomChange?: (room: string) => void;
  hours: string[];
  recesses?: string[];
  onUpdateSettings?: (updates: Partial<AppState>) => void;
  language?: Language;
  onRefreshData?: () => Promise<void> | void;
}

const translations = {
  es: {
    titlePrep: 'Gestor de Horarios - Preparatoria',
    titleSec: 'Gestor de Horarios - Secundaria',
    subtitle: 'Diseña la estructura de grupos, materias y aulas.',
    searchPlaceholder: 'Buscar (ej. Inglés, Prof. Ana...)',
    selectRoom: 'Seleccionar Aula',
    confirmDeleteAll: 'Esta acción borrará permanentemente todas las clases asignadas a este sector.',
    exportPdf: 'EXPORTAR PDF',
    exportExcel: 'EXPORTAR EXCEL',
    hours: 'Horas',
    addSlot: 'Asignar Horario',
    errorRequired: 'El profesor y el salón son obligatorios.',
    groupConflict: 'El grupo {group} ya tiene programada la clase de {subject} a esta hora.',
    teacherConflict: 'El docente {teacher} ya tiene programada la clase de {subject} a esta hora.',
    roomConflict: 'El salón {room} ya está ocupado a esta hora por la clase de {subject}.',
    deleteClass: 'Eliminar Clase',
    deleteAll: 'Borrar Todo',
    cancel: 'Cancelar',
    create: 'Crear',
    close: 'Cerrar',
    noClasses: 'No hay clases programadas.',
    noClassesFound: 'No se encontraron materias con esta búsqueda.',
    groupLabel: 'Grupo',
    subjectPlaceholder: 'Ej. Física Superior',
    teacherPlaceholder: 'Ej. Lic. Juan Pérez',
    teacherSuggestions: 'Profesores disponibles ahora:',
    roomPlaceholder: 'Ej. Laboratorio A',
    selectGroup: 'Seleccionar Grupo',
    subjectField: 'Materia',
    teacherField: 'Docente',
    roomField: 'Salón',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    clearConfirmText: '¿Estás seguro de que deseas eliminar todas las clases de este sector?',
    warningAction: 'Esta acción no se puede deshacer.',
    warningDeleteAllTitle: 'Eliminar Horarios',
    warningDeleteAllDesc: 'Esta acción eliminará permanentemente todas las clases programadas en este horario.',
    refresh: 'Actualizar',
  },
  en: {
    titlePrep: 'Schedule Manager - High School',
    titleSec: 'Schedule Manager - Middle School',
    subtitle: 'Design group structures, subjects, and classrooms.',
    searchPlaceholder: 'Search (e.g., English, Prof. Ana...)',
    selectRoom: 'Select Classroom',
    confirmDeleteAll: 'This action will permanently delete all classes assigned to this sector.',
    exportPdf: 'EXPORT PDF',
    exportExcel: 'EXPORT EXCEL',
    hours: 'Hours',
    addSlot: 'Assign Schedule',
    errorRequired: 'Teacher and Classroom are required.',
    groupConflict: 'The group {group} already has a {subject} class scheduled for this hour.',
    teacherConflict: 'Teacher {teacher} already has a {subject} class scheduled for this hour.',
    roomConflict: 'Classroom {room} is already occupied at this hour by a {subject} class.',
    deleteClass: 'Delete Class',
    deleteAll: 'Delete All',
    cancel: 'Cancel',
    create: 'Create',
    close: 'Close',
    noClasses: 'No classes scheduled.',
    noClassesFound: 'No subjects found matching your search.',
    groupLabel: 'Group',
    subjectPlaceholder: 'e.g. Advanced Physics',
    teacherPlaceholder: 'e.g. John Doe, M.Sc.',
    teacherSuggestions: 'Teachers available now:',
    roomPlaceholder: 'e.g. Lab A',
    selectGroup: 'Select Group',
    subjectField: 'Subject',
    teacherField: 'Teacher',
    roomField: 'Classroom',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    clearConfirmText: 'Are you sure you want to delete all classes for this sector?',
    warningAction: 'This action cannot be undone.',
    warningDeleteAllTitle: 'Delete Schedules',
    warningDeleteAllDesc: 'This action will permanently delete all scheduled classes in this schedule view.',
    refresh: 'Refresh',
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

export const Scheduler: React.FC<SchedulerProps> = ({ 
  sector, 
  themeColor, 
  isDarkMode, 
  currentUser,
  allClasses,
  onUpdateClasses,
  availabilities,
  selectedRoom,
  onRoomChange,
  hours,
  recesses = [],
  onUpdateSettings,
  language = 'es',
  onRefreshData
}) => {
  const t = translations[language];
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  React.useEffect(() => {
    const wasRefreshed = localStorage.getItem('sys_refreshed_toast');
    if (wasRefreshed) {
      localStorage.removeItem('sys_refreshed_toast');
      setToastMessage({
        text: language === 'es' ? '¡Sistema reiniciado, limpio de fallos y sincronizado!' : 'System refreshed, cleared of errors, and synchronised!',
        type: 'success'
      });
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }
  }, [language]);

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
      setToastMessage({
        text: language === 'es' ? 'Error al actualizar: mostrando datos sin conexión' : 'Refresh failed: showing offline data',
        type: 'warning'
      });
      setLocalRefreshing(false);
    }
  };

  const dbDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const days = t.days;
  
  let localRoomHours = hours && hours.length > 0 ? hours : (sector === Sector.PREPARATORY 
    ? [
        '7:20 - 8:10', '8:10 - 9:00', '9:00 - 9:50', '9:50 - 10:40',
        '10:40 - 11:30', '11:30 - 12:20', '12:20 - 13:10', '13:10 - 13:20', '13:20 - 14:10'
      ]
    : [
        '7:00 - 7:50', '7:50 - 8:40', '8:40 - 9:10', '9:10 - 10:00', '10:00 - 10:10',
        '10:10 - 11:00', '11:00 - 11:50', '11:50 - 12:40', '12:40 - 12:50', '12:50 - 13:40'
      ]);
  
  let localRoomRecesses = recesses && recesses.length > 0 ? recesses : (sector === Sector.PREPARATORY 
    ? ['13:10 - 13:20']
    : ['8:40 - 9:10', '10:00 - 10:10', '12:40 - 12:50']);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; hour: string } | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>(selectedRoom || '');
  const [newGroup, setNewGroup] = useState('');
  const [editingHourIndex, setEditingHourIndex] = useState<number | null>(null);
  const [editingHourValue, setEditingHourValue] = useState('');

  const handleEditHour = (index: number, value: string) => {
    setEditingHourIndex(index);
    setEditingHourValue(value);
  };

  const handleSaveHour = () => {
    if (editingHourIndex !== null && onUpdateSettings) {
      const oldHour = localRoomHours[editingHourIndex];
      const newHours = [...localRoomHours];
      newHours[editingHourIndex] = editingHourValue;
      
      const updates = {
        settings: {
          ...(sector === Sector.PREPARATORY 
               ? { hoursPreparatory: newHours }
               : { hoursSecondary: newHours })
        }
      };
      
      onUpdateSettings(updates as any);
      
      // Update any classes that were assigned to the old hour
      if (oldHour !== editingHourValue) {
        const updatedClasses = allClasses.map(c => 
          c.hour === oldHour ? { ...c, hour: editingHourValue } : c
        );
        onUpdateClasses(updatedClasses);
      }
      
      setEditingHourIndex(null);
    }
  };

  const handleToggleRecess = (hourValue: string) => {
    if (onUpdateSettings) {
      const isAlreadyRecess = localRoomRecesses.includes(hourValue);
      let newRecesses = [...localRoomRecesses];
      if (isAlreadyRecess) {
        newRecesses = newRecesses.filter(h => h !== hourValue);
      } else {
        newRecesses.push(hourValue);
      }
      
      const updates = {
        settings: {
          ...(sector === Sector.PREPARATORY 
               ? { recessesPreparatory: newRecesses }
               : { recessesSecondary: newRecesses })
        }
      };
      
      onUpdateSettings(updates as any);
      setToastMessage({
        text: language === 'es' 
          ? `Hora ${hourValue} configurada como ${isAlreadyRecess ? 'Horario de clase' : 'Receso escolar'}` 
          : `Hour ${hourValue} configured as ${isAlreadyRecess ? 'Class time' : 'School recess'}`,
        type: 'success'
      });
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  // Sync with prop when it changes (redirection)
  React.useEffect(() => {
    if (selectedRoom && selectedRoom !== selectedRoomFilter) {
      setSelectedRoomFilter(selectedRoom);
    }
  }, [selectedRoom]);

  // Notify parent when local filter changes
  const handleRoomFilterChange = (room: string) => {
    setSelectedRoomFilter(room);
    if (onRoomChange) onRoomChange(room);
  };

  // Sugerencias de profesores basadas en disponibilidad
  const teacherSuggestions = availabilities.filter(a => 
    selectedSlot && a.slots.includes(`${selectedSlot.day}-${selectedSlot.hour}`)
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  // Filtramos las clases por el sector actual
  const classes = allClasses.filter(c => c.sector === sector);

  // Lista de salones disponibles (derivada de las clases + básicos)
  const availableRooms = sector === Sector.PREPARATORY 
    ? [...PREPARATORY_ROOMS] 
    : [...SECONDARY_ROOMS];

  // Asegurar que haya un salón seleccionado por defecto si no hay ninguno
  React.useEffect(() => {
    if (!selectedRoomFilter && availableRooms.length > 0) {
      setSelectedRoomFilter(availableRooms[0]);
    }
  }, [availableRooms, selectedRoomFilter]);

  const filteredClasses = classes.filter(c => {
    const matchesSearch = searchTerm === '' ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.group.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro obligatorio por salón (sin "Todos")
    const matchesRoom = c.room === selectedRoomFilter;
    
    return matchesSearch && matchesRoom;
  });

  const sectorGroups = sector === Sector.PREPARATORY 
    ? ['2º A', '2º B', '2º C', '2º D', '2º E', '2º F', '4º A', '4º B', '4º C', '4º D', '4º E', '6º A', '6º B', '6º C', '6º D', '6º E']
    : ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C'];

  const vibrant = getVibrantColor(themeColor);

  const handleCellClick = (day: string, hour: string) => {
    setSelectedSlot({ day, hour });
    setNewRoom(selectedRoomFilter); // Pre-fill with current selected room
    setIsModalOpen(true);
  };

  const handleEditClick = (classData: ClassData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlot({ day: classData.day, hour: classData.hour });
    setNewClassName(classData.subject);
    setNewTeacherName(classData.teacher);
    setNewRoom(classData.room);
    setNewGroup(classData.group);
    setEditingClassId(classData.id);
    setIsModalOpen(true);
  };

  const addClass = () => {
    setConflictError(null);
    if (newClassName && selectedSlot) {
      if (!newTeacherName || !newRoom) {
        setConflictError(t.errorRequired);
        return;
      }

      const isRecess = newTeacherName.trim().toUpperCase() === 'RECESO';

      const teacherConflict = !isRecess && allClasses.find(c => 
        c.id !== editingClassId &&
        c.day === selectedSlot.day && 
        c.hour === selectedSlot.hour && 
        c.teacher.trim().toLowerCase() === newTeacherName.trim().toLowerCase()
      );

      const roomConflict = !isRecess && allClasses.find(c => 
        c.id !== editingClassId &&
        c.day === selectedSlot.day && 
        c.hour === selectedSlot.hour && 
        c.room.trim().toLowerCase() === newRoom.trim().toLowerCase()
      );

      const groupConflict = !isRecess && allClasses.find(c => 
        c.id !== editingClassId &&
        c.day === selectedSlot.day && 
        c.hour === selectedSlot.hour && 
        c.group === newGroup
      );

      if (teacherConflict) {
        setConflictError(t.teacherConflict.replace('{teacher}', newTeacherName).replace('{subject}', teacherConflict.subject));
        return;
      }

      if (roomConflict) {
        setConflictError(t.roomConflict.replace('{room}', newRoom).replace('{subject}', roomConflict.subject));
        return;
      }

      if (groupConflict) {
        setConflictError(t.groupConflict.replace('{group}', newGroup).replace('{subject}', groupConflict.subject));
        return;
      }

      if (editingClassId) {
        onUpdateClasses(allClasses.map(c => c.id === editingClassId ? {
          ...c,
          subject: newClassName,
          teacher: newTeacherName,
          room: newRoom,
          group: newGroup || sectorGroups[0],
          day: selectedSlot.day,
          hour: selectedSlot.hour
        } : c));
      } else {
        const newClass: ClassData = {
          id: Math.random().toString(36).substr(2, 9),
          subject: newClassName,
          teacher: newTeacherName,
          room: newRoom,
          day: selectedSlot.day,
          hour: selectedSlot.hour,
          sector: sector,
          group: newGroup || sectorGroups[0]
        };
        onUpdateClasses([...allClasses, newClass]);
      }
      
      setNewClassName('');
      setNewTeacherName('');
      setNewRoom('');
      setEditingClassId(null);
      setIsModalOpen(false);
      setConflictError(null);
    } else {
      setConflictError(language === 'es' ? 'El nombre de la materia es obligatorio.' : 'Subject name is required.');
    }
  };

  const deleteClass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(id);
  };

  const confirmDeleteClass = () => {
    if (classToDelete) {
      onUpdateClasses(allClasses.filter((c) => c.id !== classToDelete));
      setClassToDelete(null);
    }
  };

  const clearAllClasses = () => {
    // Borramos solo las clases del sector actual
    onUpdateClasses(allClasses.filter(c => c.sector !== sector));
    setShowClearConfirm(false);
  };

  const exportToPDF = () => {
    // Extract unique classrooms having any assigned school classes
    const roomsWithClasses: string[] = Array.from(
      new Set(allClasses.map(c => c.room.trim()))
    ).filter((r): r is string => !!r).sort();

    if (roomsWithClasses.length === 0) {
      alert(
        language === 'es'
          ? 'No hay clases programadas en ningún salón para exportar.'
          : 'There are no active classes scheduled in any classroom to export.'
      );
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US');
    const formattedTime = now.toLocaleTimeString(language === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    roomsWithClasses.forEach((roomName, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // 1. Sleek Page Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Colegio Juan Pablo II", 14, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        language === 'es'
          ? "SISTEMA INTEGRAL DE PLANIFICACIÓN DE HORARIOS"
          : "INTEGRATED SCHOOL SCHEDULING SYSTEM",
        14, 24
      );

      // Horizontal separator rule
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 28, 283, 28);

      // 2. Classroom Title Block
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(
        language === 'es'
          ? `Horario de Disponibilidad de Aula: ${roomName.toUpperCase()}`
          : `Classroom Schedule: ${roomName.toUpperCase()}`,
        14, 38
      );

      // 3. Metadata block (Classroom, Date of generation, Time of generation)
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`${language === 'es' ? 'Fecha de generación' : 'Generated on'}:`, 210, 36);
      doc.setFont("Helvetica", "normal");
      doc.text(formattedDate, 250, 36);

      doc.setFont("Helvetica", "bold");
      doc.text(`${language === 'es' ? 'Hora de generación' : 'Generation hour'}:`, 210, 42);
      doc.setFont("Helvetica", "normal");
      doc.text(formattedTime, 250, 42);

      // Separator border line before schedule data table
      doc.line(14, 48, 283, 48);

      // Filter classes assigned only to this specific classroom
      const roomClasses = allClasses.filter(c => c.room.trim().toLowerCase() === roomName.toLowerCase());

      // Prepare schedule rows
      const tableRows: any[] = [];
      localRoomHours.forEach(hour => {
        const isRecess = localRoomRecesses.includes(hour);
        const row = [hour];
        dbDays.forEach(day => {
          if (isRecess) {
            row.push(language === 'es' ? '☕ RECREO' : '☕ RECESS');
          } else {
            const classInSlot = roomClasses.find(c => c.day === day && c.hour === hour);
            if (classInSlot) {
              if (classInSlot.teacher === "RECESO") {
                row.push(language === 'es' ? '☕ RECREO ESCOLAR' : '☕ DYNAMIC RECESS');
              } else {
                const labelSector = classInSlot.sector === Sector.PREPARATORY
                  ? (language === 'es' ? 'PREPARATORIA' : 'HIGH SCHOOL')
                  : (language === 'es' ? 'SECUNDARIA' : 'MIDDLE SCHOOL');
                row.push(`${classInSlot.subject} (${classInSlot.group})\n${classInSlot.teacher}\n[${labelSector}]`);
              }
            } else {
              row.push('-');
            }
          }
        });
        tableRows.push(row);
      });

      // 4. Render Horizontal Matrice Table via autoTable
      const availableHeight = 195 - 50; // 210 A4 height minus 50 startY minus 15 footer
      const computedCellHeight = Math.max(10, Math.floor(availableHeight / Math.max(1, localRoomHours.length)));

      autoTable(doc, {
        head: [[language === 'es' ? 'Modulo / Hora' : 'Slot / Hour', ...days]],
        body: tableRows,
        startY: 50,
        margin: { bottom: 12 },
        rowPageBreak: 'avoid',
        styles: {
          fontSize: 6.5,
          cellPadding: 1,
          minCellHeight: computedCellHeight,
          halign: 'center',
          valign: 'middle',
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold', halign: 'left' }
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          minCellHeight: 10
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const isRowRecess = localRoomRecesses.includes(localRoomHours[data.row.index]);
            const isDynamicRecessCell = typeof data.cell.raw === 'string' && data.cell.raw.includes('☕');
            if (isRowRecess || isDynamicRecessCell) {
              // Mark the recess hour/cell with custom golden styling
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [180, 83, 9];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      // 5. Draw running footer with dynamic page metrics
      const pageHeight = doc.internal.pageSize.height;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400

      const footerText = language === 'es'
        ? `Colegio de Bachilleres Juan Pablo II • Smart Scheduler • Aula: ${roomName} • Página ${index + 1} de ${roomsWithClasses.length}`
        : `Juan Pablo II High School • Smart Scheduler • Classroom: ${roomName} • Page ${index + 1} of ${roomsWithClasses.length}`;

      doc.text(footerText, 14, pageHeight - 8);
    });

    const fileDateStr = now.toISOString().split('T')[0];
    doc.save(`Horarios_Aulas_Colegio_JPII_${fileDateStr}.pdf`);
  };

  const exportToExcel = () => {
    // Extract unique classrooms having any assigned school classes
    const roomsWithClasses: string[] = Array.from(
      new Set(allClasses.map(c => c.room.trim()))
    ).filter((r): r is string => !!r).sort();

    if (roomsWithClasses.length === 0) {
      alert(
        language === 'es'
          ? 'No hay clases programadas en ningún salón para exportar.'
          : 'There are no active classes scheduled in any classroom to export.'
      );
      return;
    }

    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new();

      roomsWithClasses.forEach((roomName) => {
        const roomClasses = allClasses.filter(c => c.room.trim().toLowerCase() === roomName.toLowerCase());
        
        const headerRow = [language === 'es' ? 'Modulo / Hora' : 'Slot / Hour', ...days];
        const sheetData: any[][] = [headerRow];

        localRoomHours.forEach(hour => {
          const isRecess = localRoomRecesses.includes(hour);
          const row = [hour];
          
          dbDays.forEach(day => {
            if (isRecess) {
              row.push(language === 'es' ? '☕ RECREO' : '☕ RECESS');
            } else {
              const classInSlot = roomClasses.find(c => c.day === day && c.hour === hour);
              if (classInSlot) {
                if (classInSlot.teacher === "RECESO") {
                  row.push(language === 'es' ? '☕ RECREO ESCOLAR' : '☕ DYNAMIC RECESS');
                } else {
                  const labelSector = classInSlot.sector === Sector.PREPARATORY
                    ? (language === 'es' ? 'PREPARATORIA' : 'HIGH SCHOOL')
                    : (language === 'es' ? 'SECUNDARIA' : 'MIDDLE SCHOOL');
                  row.push(`${classInSlot.subject} (${classInSlot.group})\n${classInSlot.teacher}\n[${labelSector}]`);
                }
              } else {
                row.push('-');
              }
            }
          });
          sheetData.push(row);
        });

        let sheetName = roomName.replace(/[\\/?*[\]]/g, '').substring(0, 31);
        if (!sheetName) sheetName = "Hoja";
        
        // Handle conflicting sheet names (if first 31 chars match)
        if (wb.SheetNames.includes(sheetName)) {
           sheetName = sheetName.substring(0, 26) + "_" + Math.floor(Math.random() * 1000);
        }

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const now = new Date();
      const fileDateStr = now.toISOString().split('T')[0];
      XLSX.writeFile(wb, `Horarios_Aulas_Colegio_JPII_${fileDateStr}.xlsx`);
    }).catch(err => {
      console.error("Failed to load xlsx chunk", err);
      import('xlsx').then((XLSX) => {
        // Fallback or retry
      });
    });
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col relative">
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-6 duration-300 font-bold text-xs ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-amber-500 text-white shadow-amber-500/20'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sector === Sector.PREPARATORY ? t.titlePrep : t.titleSec}</h2>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className={`flex items-center px-4 py-2.5 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 focus-within:border-gray-600' : 'bg-white border-slate-200 focus-within:border-slate-400'}`}>
            <Search size={18} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent border-none outline-none text-sm w-full md:w-56 ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'}`}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">{t.roomField}:</label>
            <select
              value={selectedRoomFilter}
              onChange={(e) => handleRoomFilterChange(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-${vibrant}/20 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200'}`}
            >
              {availableRooms.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className={`flex p-1 rounded-xl border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'calendar' ? `bg-${vibrant} text-white shadow-lg` : 'text-gray-500 hover:text-slate-900'}`}
            >
              <Calendar size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? `bg-${vibrant} text-white shadow-lg` : 'text-gray-500 hover:text-slate-900'}`}
            >
              <List size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => classes.length > 0 && setShowClearConfirm(true)}
            className={`flex items-center space-x-2 px-4 py-3 border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-bold transition-all ${classes.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Trash2 size={20} />
            <span className="hidden sm:inline">{t.deleteAll.toUpperCase()}</span>
          </button>
          
          <button 
            onClick={exportToPDF}
            className={`flex items-center space-x-2 px-6 py-3 bg-${vibrant} hover:opacity-90 text-white rounded-2xl font-black shadow-xl shadow-${themeColor}-900/20 transition-all`}
          >
            <Download size={20} />
            <span className="hidden sm:inline">{t.exportPdf.toUpperCase()}</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button 
            onClick={exportToExcel}
            className={`flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:opacity-90 text-white rounded-2xl font-black shadow-xl shadow-emerald-900/20 transition-all`}
          >
            <Download size={20} />
            <span className="hidden sm:inline">{t.exportExcel.toUpperCase()}</span>
            <span className="sm:hidden">EXCEL</span>
          </button>

          <button 
            onClick={handleRefresh}
            className={`flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:opacity-90 text-white rounded-2xl font-black shadow-xl shadow-indigo-900/20 transition-all ${localRefreshing ? 'opacity-80 scale-95' : ''}`}
            title={t.refresh}
            disabled={localRefreshing}
          >
            <RefreshCw size={20} className={localRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{localRefreshing ? 'CARGANDO...' : t.refresh.toUpperCase()}</span>
            <span className="sm:hidden">{localRefreshing ? '...' : t.refresh.toUpperCase()}</span>
          </button>
        </div>
      </header>

      <div className={`flex-1 border rounded-[2rem] overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-xl'}`}>
        <div className="h-full overflow-auto custom-scrollbar">
          {viewMode === 'calendar' ? (
            <div className="min-w-[800px] lg:min-w-full">
              <table className="w-full border-collapse table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr className={isDarkMode ? 'bg-gray-950/90 backdrop-blur-md' : 'bg-slate-50/90 backdrop-blur-md'}>
                    <th className={`p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-24 border-b border-r ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>{t.hours}</th>
                    {days.map(day => (
                      <th key={day} className={`p-5 text-center text-xs font-black uppercase tracking-widest border-b border-r last:border-r-0 ${isDarkMode ? 'border-gray-800 text-gray-300' : 'border-slate-100 text-slate-500'}`}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localRoomHours.map((hour, idx) => {
                    const isRecess = localRoomRecesses.includes(hour);
                    return (
                      <tr key={idx} className={`border-b last:border-0 transition-colors ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
                      <td 
                        className={`p-3 relative group/hour text-[11px] font-black text-center transition-colors border-r min-w-[120px] ${isDarkMode ? 'text-gray-600 border-gray-800 bg-gray-900/50' : 'text-slate-400 border-slate-100 bg-slate-50/50'}`}
                      >
                        {editingHourIndex === idx ? (
                          <div className="flex flex-col gap-1 items-center bg-white/5 p-1 rounded w-full">
                            <input
                              type="time"
                              autoFocus
                              value={editingHourValue.split('-')[0]?.trim() || ''}
                              onChange={(e) => {
                                const newEnd = editingHourValue.split('-')[1]?.trim() || '';
                                setEditingHourValue(`${e.target.value} - ${newEnd}`);
                              }}
                              className={`w-full max-w-[80px] bg-transparent outline-none text-center rounded border text-xs py-0.5 ${isDarkMode ? 'text-white border-gray-700' : 'text-slate-900 border-slate-300'}`}
                            />
                            <div className="flex items-center gap-1 w-full justify-center">
                              <span className={isDarkMode ? 'text-gray-500' : 'text-slate-400'}>-</span>
                            </div>
                            <input
                              type="time"
                              value={editingHourValue.split('-')[1]?.trim() || ''}
                              onChange={(e) => {
                                const newStart = editingHourValue.split('-')[0]?.trim() || '';
                                setEditingHourValue(`${newStart} - ${e.target.value}`);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveHour();
                                if (e.key === 'Escape') setEditingHourIndex(null);
                              }}
                              className={`w-full max-w-[80px] bg-transparent outline-none text-center rounded border text-xs py-0.5 ${isDarkMode ? 'text-white border-gray-700' : 'text-slate-900 border-slate-300'}`}
                            />
                            <button onClick={handleSaveHour} className={`mt-1 p-1 w-full rounded hover:bg-black/10 flex justify-center items-center gap-1 bg-black/5 transition-colors ${isDarkMode ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
                              <Check size={14} /> <span className="text-[10px] font-bold">OK</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {isRecess && <Coffee size={12} className="text-amber-500 shrink-0 animate-pulse" />}
                            <span>{hour}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover/hour:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditHour(idx, hour)}
                                className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}
                                title={language === 'es' ? 'Editar hora' : 'Edit hour'}
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => handleToggleRecess(hour)}
                                className={`p-1 rounded-md transition-colors ${
                                  isRecess 
                                    ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' 
                                    : isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-slate-500'
                                }`}
                                title={language === 'es' ? 'Alternar como receso' : 'Toggle as recess'}
                              >
                                <Coffee size={11} className={isRecess ? 'text-amber-500' : ''} />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      {isRecess ? (
                        <td 
                          colSpan={days.length} 
                          className={`p-4 text-center font-black tracking-[0.3em] text-[10px] uppercase align-middle ${
                            isDarkMode ? 'bg-amber-500/10 text-amber-500 border-gray-800' : 'bg-amber-50/45 text-amber-600 border-slate-100'
                          }`}
                        >
                          ☕ RECREO ESCOLAR / RECESO
                        </td>
                      ) : (
                        dbDays.map(day => {
                          const classInSlot = filteredClasses.find(c => c.day === day && c.hour === hour);
                        return (
                          <td 
                            key={`${day}-${hour}`} 
                            onClick={() => !classInSlot && handleCellClick(day, hour)}
                            className={`p-3 border-r last:border-r-0 h-32 min-w-[150px] cursor-pointer transition-all relative group ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/30' : 'border-slate-100 hover:bg-slate-50'}`}
                          >
                            {classInSlot ? (
                              classInSlot.teacher === "RECESO" ? (
                                <div className={`w-full h-full p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col justify-center items-center animate-in zoom-in-95 group/card text-center`}>
                                  <Coffee size={24} className="text-amber-500 mb-2 animate-pulse" />
                                  <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{classInSlot.subject}</p>
                                  <button 
                                    onClick={(e) => deleteClass(classInSlot.id, e)}
                                    className="absolute top-2 right-2 p-1.5 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className={`w-full h-full p-4 rounded-2xl bg-${vibrant}/10 border-2 border-${vibrant}/30 flex flex-col justify-between animate-in zoom-in-95 group/card`}>
                                  <div className="flex justify-between items-start">
                                    <div className={`p-1.5 rounded-lg bg-${vibrant}/20 text-${vibrant}`}>
                                      <Book size={14} />
                                    </div>
                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 transition-all">
                                      <button 
                                        onClick={(e) => handleEditClick(classInSlot, e)}
                                        className={`p-1.5 text-${vibrant} hover:bg-${vibrant}/20 rounded-lg transition-all`}
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button 
                                        onClick={(e) => deleteClass(classInSlot.id, e)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${vibrant} text-white uppercase`}>
                                        {classInSlot.group}
                                      </span>
                                    </div>
                                    <p className={`text-sm font-black uppercase tracking-tight truncate text-${vibrant}`}>{classInSlot.subject}</p>
                                    <p className="text-[10px] font-bold text-gray-500 truncate mt-0.5">{classInSlot.teacher}</p>
                                    <div className="flex items-center gap-1 mt-1 text-gray-400">
                                      <MapPin size={10} />
                                      <span className="text-[10px] font-bold uppercase">{classInSlot.room}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Plus size={24} className="text-gray-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                              </div>
                            )}
                          </td>
                        );
                      })
                      )}
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 space-y-4">
              {filteredClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Calendar size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {searchTerm ? t.noClassesFound : t.noClasses}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredClasses.sort((a, b) => {
                    const dayOrder = dbDays.indexOf(a.day) - dbDays.indexOf(b.day);
                    if (dayOrder !== 0) return dayOrder;
                    return parseInt(a.hour) - parseInt(b.hour);
                  }).map(c => (
                    <div key={c.id} className={`p-6 rounded-3xl border-2 flex items-center justify-between group transition-all ${isDarkMode ? 'bg-gray-800/50 border-gray-800 hover:border-gray-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-${vibrant}/20 text-${vibrant}`}>
                          <Book size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className={`font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{c.subject}</h4>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-black bg-${vibrant}/10 text-${vibrant} uppercase`}>
                               {c.group}
                             </span>
                          </div>
                          <p className={`text-[10px] font-bold text-${vibrant} uppercase tracking-wider`}>{c.teacher}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {c.day} • {c.hour} • {c.room}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleEditClick(c, e)}
                          className={`p-3 text-${vibrant} hover:bg-${vibrant}/10 rounded-2xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100`}
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={(e) => deleteClass(c.id, e)}
                          className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 sm:p-10 shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{t.addSlot}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t.days[dbDays.indexOf(selectedSlot?.day || '')]} a las {selectedSlot?.hour}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingClassId(null); setConflictError(null); }} className={`p-3 rounded-2xl transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              {conflictError && (
                <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-500 text-sm p-4 rounded-xl flex items-start gap-3 animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{conflictError}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.groupLabel}</label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-${vibrant}/20 focus:border-${vibrant} font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                  <option value="">{t.selectGroup}</option>
                  {sectorGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.subjectField}</label>
                <div className="relative">
                  <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    autoFocus
                    type="text" 
                    value={newClassName}
                    onChange={(e) => { setNewClassName(e.target.value); setConflictError(null); }}
                    placeholder={t.subjectPlaceholder}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-${vibrant}/20 focus:border-${vibrant} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.teacherField}</label>
                <div className="relative">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    value={newTeacherName}
                    onChange={(e) => { setNewTeacherName(e.target.value); setConflictError(null); }}
                    placeholder={t.teacherPlaceholder}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-${vibrant}/20 focus:border-${vibrant} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                
                {/* Sugerencias de disponibilidad y Recesos */}
                <div className="mt-4 p-4 rounded-2xl bg-indigo-500/5 border border-dashed border-indigo-500/20">
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Coffee size={14} className="text-amber-500 animate-pulse" />
                    <span>{language === 'es' ? 'Recesos y Sugerencias' : 'Recesses & Suggestions'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* Botón de Receso / Recreo */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewTeacherName('RECESO');
                        setNewClassName(language === 'es' ? '☕ RECREO ESCOLAR' : '☕ RECESS');
                        setNewRoom(selectedRoomFilter || 'Patio');
                        setConflictError(null);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                        isDarkMode 
                          ? 'bg-amber-500/25 border-amber-500/40 text-amber-300 hover:bg-amber-500/35' 
                          : 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-sm'
                      }`}
                    >
                      <Coffee size={14} className="text-amber-500 animate-pulse shrink-0" />
                      <span>{language === 'es' ? 'DEFINIR COMO RECESO / RECREO' : 'SET AS RECESS / BREAK'}</span>
                    </button>

                    {/* Sugerencias de profesores si existen */}
                    {teacherSuggestions.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setNewTeacherName(t.name);
                          setNewClassName(t.subject);
                          setConflictError(null);
                        }}
                        className={`px-3 px-3.5 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          isDarkMode 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-emerald-5 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={`${t.subject} (${t.name})`}
                      >
                        {t.name} ({t.subject})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t.roomField}</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    value={newRoom}
                    onChange={(e) => { setNewRoom(e.target.value); setConflictError(null); }}
                    placeholder={t.roomPlaceholder}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-${vibrant}/20 focus:border-${vibrant} ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>
              
              <div className="pt-6 flex gap-4">
                <button 
                  onClick={addClass}
                  className={`flex-1 py-5 bg-${vibrant} text-white font-black rounded-2xl shadow-xl shadow-${themeColor}-900/40 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest uppercase`}
                >
                  {editingClassId ? (language === 'es' ? 'GUARDAR' : 'SAVE') : t.create.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmación de Borrado Individual */}
      {classToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-xs rounded-3xl p-8 shadow-2xl border text-center ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className={`text-xl font-black mb-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{language === 'es' ? '¿Eliminar clase?' : 'Delete slot?'}</h3>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              {t.warningAction}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={confirmDeleteClass}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/20 hover:scale-[1.02] active:scale-95 transition-all text-[10px] uppercase"
              >
                {t.deleteClass.toUpperCase()}
              </button>
              <button 
                onClick={() => setClassToDelete(null)}
                className={`flex-1 py-3 font-bold rounded-xl transition-all text-[10px] uppercase ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500'}`}
              >
                {t.cancel.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado Total */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 sm:p-10 shadow-2xl border text-center ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h3 className={`text-2xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.warningDeleteAllTitle}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {t.warningDeleteAllDesc}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={clearAllClasses}
                className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-xl shadow-rose-900/40 hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest uppercase"
              >
                {t.deleteAll.toUpperCase()}
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className={`w-full py-4 font-bold rounded-2xl transition-all text-xs tracking-widest uppercase ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {t.cancel.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

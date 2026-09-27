import React, { useState, useEffect } from 'react';
import { Clock, Users, Share2, Calendar, GitCompare, AlertTriangle, Search, Info, CheckCircle, Smartphone, MapPin, Layers, Sparkles, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NavItem, Sector, Language, User, ClassData, TeacherAvailability, Message } from '../types';
import { Community } from './Community';
import { Share } from './Share';

interface HorarioGeneralProps {
  allClasses: ClassData[];
  availabilities: TeacherAvailability[];
  allAvailabilities?: TeacherAvailability[];
  hours: string[];
  sector: Sector;
  isDarkMode: boolean;
  themeColor: string;
  language: Language;
  currentUser: User | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onRefreshData?: () => Promise<void> | void;
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

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const HorarioGeneral: React.FC<HorarioGeneralProps> = ({
  allClasses,
  availabilities,
  allAvailabilities = [],
  hours,
  sector,
  isDarkMode,
  themeColor,
  language,
  currentUser,
  messages,
  onSendMessage,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'comunidad' | 'compartir'>('general');
  const [combinedView, setCombinedView] = useState<boolean>(true);
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  useEffect(() => {
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
  
  const vibrant = getVibrantColor(themeColor);

  // Use all availabilities or fallback to current sector's teachers
  const teachersPool = allAvailabilities.length > 0 ? allAvailabilities : availabilities;

  // Filter teachers with search term
  const filteredTeachers = teachersPool.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Set initial selected teacher
  useEffect(() => {
    if (teachersPool.length > 0 && !selectedTeacherName) {
      // Prefer shared teachers for initial selection
      const shared = teachersPool.find(t => {
        const tClasses = allClasses.filter(c => c.teacher === t.name);
        const sectors = new Set(tClasses.map(c => c.sector));
        return sectors.has(Sector.PREPARATORY) && sectors.has(Sector.SECONDARY);
      });
      setSelectedTeacherName(shared ? shared.name : teachersPool[0].name);
    }
  }, [teachersPool, selectedTeacherName, allClasses]);

  // Combined/Union of scheduled hours across both sectors to ensure no missed slots in main grid
  const allHoursUnion = Array.from(new Set([
    ...hours,
    ...allClasses.map(c => c.hour)
  ])).filter(Boolean).sort((a, b) => {
    if (!a.includes(':') || !b.includes(':')) return a.localeCompare(b);
    const timeA = a.split('-')[0].trim();
    const timeB = b.split('-')[0].trim();
    const [hA, mA] = timeA.split(':').map(Number);
    const [hB, mB] = timeB.split(':').map(Number);
    if (hA !== hB) return hA - hB;
    return (mA || 0) - (mB || 0);
  });

  // Calculate stats for the selected teacher
  const getTeacherStats = (teacherName: string) => {
    const tClasses = allClasses.filter(c => c.teacher === teacherName);
    const prepaClasses = tClasses.filter(c => c.sector === Sector.PREPARATORY);
    const secuClasses = tClasses.filter(c => c.sector === Sector.SECONDARY);
    
    // Find travel emergencies (back-to-back classes in different sectors)
    let transitWarnings = 0;
    const warningDetails: string[] = [];

    days.forEach(day => {
      const dayClasses = tClasses.filter(c => c.day === day);
      if (dayClasses.length > 1) {
        // Sort by hour in allHoursUnion
        const sorted = dayClasses
          .map(cl => ({ ...cl, hourIndex: allHoursUnion.indexOf(cl.hour) }))
          .filter(cl => cl.hourIndex !== -1)
          .sort((a, b) => a.hourIndex - b.hourIndex);

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].sector !== sorted[i-1].sector) {
            const gap = sorted[i].hourIndex - sorted[i-1].hourIndex;
            if (gap === 1) {
              transitWarnings++;
              warningDetails.push(`${day}: Cambio inmediato de clase de ${sorted[i-1].sector} (${sorted[i-1].hour}) a ${sorted[i].sector} (${sorted[i].hour}). Falta de tiempo de traslado.`);
            }
          }
        }
      }
    });

    // Find same-slot collisions/overlaps
    let collisions = 0;
    const collisionDetails: string[] = [];
    days.forEach(day => {
      allHoursUnion.forEach(hr => {
        const matches = tClasses.filter(c => c.day === day && c.hour === hr);
        if (matches.length > 1) {
          collisions++;
          collisionDetails.push(`${day} en módulo ${hr}: Colisión entre ${matches[0].sector} (${matches[0].group}) y ${matches[1].sector} (${matches[1].group})`);
        }
      });
    });

    return {
      prepaHoursCount: prepaClasses.length,
      secuHoursCount: secuClasses.length,
      totalHoursCount: tClasses.length,
      transitWarnings,
      warningDetails,
      collisions,
      collisionDetails
    };
  };

  const selectedTeacherStats = selectedTeacherName ? getTeacherStats(selectedTeacherName) : null;

  const exportGeneralPDF = () => {
    if (filteredTeachers.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const now = new Date();

    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`HORARIO GENERAL DE DOCENTES - Colegio Juan Pablo II`, 14, 16);
    
    const tableData: any[] = [];
    filteredTeachers.forEach(teacher => {
      const row = [teacher.name];
      days.forEach(day => {
        let cellContent = '';
        allHoursUnion.forEach(hour => {
          const matchingClasses = allClasses.filter(c => 
            c.teacher === teacher.name && 
            c.day === day && 
            c.hour === hour &&
            (combinedView ? true : c.sector === sector)
          );
          if (matchingClasses.length > 0) {
            matchingClasses.forEach(cl => {
               cellContent += `[${hour}] ${cl.subject} - ${cl.group} (${cl.room})\n`;
            });
          }
        });
        row.push(cellContent.trim() || 'Libre');
      });
      tableData.push(row);
    });

    autoTable(doc, {
      startY: 30,
      head: [['Docente', ...days]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 } // Teacher name column
      },
      margin: { top: 30, right: 10, bottom: 15, left: 10 }
    });

    doc.setTextColor(100);
    doc.setFontSize(8);
    const dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Generado el: ${dateStr}`, 14, pageHeight - 8);

    const fileDateStr = now.toISOString().split('T')[0];
    doc.save(`Horario_General_Docentes_${fileDateStr}.pdf`);
  };

  const exportGeneralExcel = () => {
    if (filteredTeachers.length === 0) return;
    
    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new();
      
      const headerRow = ['Docente', ...days];
      const sheetData: any[][] = [headerRow];

      filteredTeachers.forEach(teacher => {
        const row = [teacher.name];
        days.forEach(day => {
          let cellContent = '';
          allHoursUnion.forEach(hour => {
            const matchingClasses = allClasses.filter(c => 
              c.teacher === teacher.name && 
              c.day === day && 
              c.hour === hour &&
              (combinedView ? true : c.sector === sector)
            );
            if (matchingClasses.length > 0) {
              matchingClasses.forEach(cl => {
                 cellContent += `[${hour}] ${cl.subject} - ${cl.group} (${cl.room})\n`;
              });
            }
          });
          row.push(cellContent.trim() || 'Libre');
        });
        sheetData.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Basic column widths
      ws['!cols'] = [
        { wch: 25 }, // Docente
        { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 } // Days
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Horario General Docentes');

      const now = new Date();
      const fileDateStr = now.toISOString().split('T')[0];
      XLSX.writeFile(wb, `Horario_General_Docentes_${fileDateStr}.xlsx`);
    }).catch(err => {
      console.error("Failed to load xlsx chunk", err);
    });
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center space-x-2 px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-6 duration-300 font-bold text-xs ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-amber-500 text-white shadow-amber-500/20'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}
      {/* Tab Header Navigation */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {activeTab === 'general' ? 'Horario General Crossover' : activeTab === 'comunidad' ? 'Comunidad Docente' : 'Compartir Web App'}
          </h2>
          <p className="text-gray-500">
            {activeTab === 'general' 
              ? 'Panel de control cruzado para vigilar horas y aulas de docentes entre Secundaria y Preparatoria' 
              : activeTab === 'comunidad' 
              ? 'Tablón institucional de mensajería para coordinación de docentes' 
              : 'Comparte o exporta el enlace de la aplicación web'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className={`p-1.5 rounded-2xl flex items-center gap-1 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-slate-100'}`}>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
              activeTab === 'general'
                ? `bg-white dark:bg-gray-800 shadow-sm text-${vibrant}`
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Clock size={14} />
            Horario General
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all line-through opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-550"
            title="Versión futura (No disponible en este prototipo)"
          >
            <Users size={14} className="opacity-50" />
            Comunidad (Futuro)
          </button>
          <button
            onClick={() => setActiveTab('compartir')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
              activeTab === 'compartir'
                ? `bg-white dark:bg-gray-800 shadow-sm text-${vibrant}`
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Share2 size={14} />
            Compartir
          </button>
        </div>
      </header>

      {/* Render selected content tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          
          {/* 1. SECTOR INTERSECTION CARD (CUADRITO DE HORARIO INTEGRADO) */}
          <div className={`p-6 rounded-[2.5rem] border shadow-xl ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dashed pb-5 mb-5 border-gray-250 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500`}>
                  <GitCompare size={22} className="animate-spin-slow" />
                </div>
                <div>
                  <h3 className={`text-md font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Monitor Crossover de Docentes Compartidos (Prepa ⇄ Secundaria)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                    Análisis pedagógico de transiciones de nivel, choques de modulo y distribución horaria
                  </p>
                </div>
              </div>
              
              {/* Selector de maestro para el cuadrito integrado */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <select
                  value={selectedTeacherName}
                  onChange={(e) => setSelectedTeacherName(e.target.value)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-250 text-slate-800'}`}
                >
                  <option value="" disabled>Seleccione un Profesor...</option>
                  {teachersPool.map(t => {
                    const classesCount = allClasses.filter(c => c.teacher === t.name).length;
                    const prepa = allClasses.filter(c => c.teacher === t.name && c.sector === Sector.PREPARATORY).length;
                    const secu = allClasses.filter(c => c.teacher === t.name && c.sector === Sector.SECONDARY).length;
                    const tag = (prepa > 0 && secu > 0) ? '🔄 Compartido' : prepa > 0 ? '🎓 Prepa Only' : secu > 0 ? '🏫 Secu Only' : '💤 Libre';
                    return (
                      <option key={t.id} value={t.name}>
                        {t.name} ({classesCount} Mod. | {tag})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Content of selected teacher */}
            {selectedTeacherName && selectedTeacherStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left block: Statistics & Warning lights */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className={`p-4 rounded-3xl border flex flex-col justify-between ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Profesor Seleccionado</span>
                    <h4 className={`text-lg font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedTeacherName}</h4>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">Materias asignadas: {teachersPool.find(t => t.name === selectedTeacherName)?.subject || 'Multi-materia'}</span>
                    
                    {/* Level bar metrics */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                          <span className="flex items-center gap-1.5"><Layers size={10} className="text-zinc-500" /> Carga Total</span>
                          <span>{selectedTeacherStats.totalHoursCount} Módulos/Semana</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden flex">
                          <div 
                            style={{ width: `${selectedTeacherStats.totalHoursCount > 0 ? (selectedTeacherStats.prepaHoursCount / selectedTeacherStats.totalHoursCount) * 100 : 0}%` }}
                            className="bg-indigo-500 h-full"
                          />
                          <div 
                            style={{ width: `${selectedTeacherStats.totalHoursCount > 0 ? (selectedTeacherStats.secuHoursCount / selectedTeacherStats.totalHoursCount) * 100 : 0}%` }}
                            className="bg-amber-500 h-full"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span> Preparatoria:</span>
                          <span className="font-extrabold text-indigo-500">{selectedTeacherStats.prepaHoursCount} horas</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Secundaria:</span>
                          <span className="font-extrabold text-amber-500">{selectedTeacherStats.secuHoursCount} horas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning Alerts / Collisions detector */}
                  <div className={`p-5 rounded-3xl border flex-1 flex flex-col justify-between ${
                    selectedTeacherStats.collisions > 0
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : selectedTeacherStats.transitWarnings > 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className={selectedTeacherStats.collisions > 0 ? 'text-rose-500 animate-bounce' : selectedTeacherStats.transitWarnings > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Alertas de Choque e Incompatibilidad</span>
                      </div>
                      
                      {selectedTeacherStats.collisions === 0 && selectedTeacherStats.transitWarnings === 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">✓ Estado Operativo: Seguro</p>
                          <p className="text-[10px] text-gray-500">Este docente tiene un horario viable. No tiene materias superpuestas ni problemas de traslado inmediato entre Preparatoria y Secundaria.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedTeacherStats.collisions > 0 && (
                            <div className="text-xs text-rose-500 font-bold">
                              ⚠️ {selectedTeacherStats.collisions} Superposición(es) de Horario:
                              <ul className="list-disc pl-4 text-[10px] text-red-400 font-semibold space-y-1 mt-1">
                                {selectedTeacherStats.collisionDetails.map((det, index) => (
                                  <li key={index}>{det}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedTeacherStats.transitWarnings > 0 && (
                            <div className="text-xs text-amber-500 font-bold">
                              🔄 {selectedTeacherStats.transitWarnings} Tránsito Inmediato de Sector:
                              <ul className="list-disc pl-4 text-[10px] text-amber-600 dark:text-amber-400 font-semibold space-y-1 mt-1">
                                {selectedTeacherStats.warningDetails.map((det, index) => (
                                  <li key={index}>{det}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-yellow-500" />
                      <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Motor de integridad JP-II</span>
                    </div>
                  </div>
                </div>

                {/* Right block: Micro Calendar View for the specific Shared Teacher */}
                <div className="lg:col-span-8 overflow-x-auto rounded-3xl border border-gray-200 dark:border-gray-800 p-2 md:p-4 bg-gray-950/20">
                  <div className="min-w-[650px]">
                    <div className="grid grid-cols-7 gap-2 pb-2 text-center text-[10px] uppercase font-black text-gray-400 border-b border-gray-800 mb-2">
                      <div className="text-left pl-2">Módulo</div>
                      {days.map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div className="space-y-1">
                      {allHoursUnion.map(hour => {
                        return (
                          <div key={hour} className="grid grid-cols-7 gap-2 items-center text-center">
                            {/* Hour name */}
                            <div className="text-left pl-2 text-[10px] font-black text-gray-500 font-mono py-1">
                              {hour}
                            </div>
                            
                            {/* Days items */}
                            {days.map(day => {
                              const lessons = allClasses.filter(c => c.teacher === selectedTeacherName && c.day === day && c.hour === hour);
                              
                              if (lessons.length === 0) {
                                return (
                                  <div key={`${day}-${hour}`} className="h-14 rounded-2xl border border-dashed border-gray-200/20 flex items-center justify-center text-[9px] text-gray-600 font-bold">
                                    Libre
                                  </div>
                                );
                              }

                              const isCol = lessons.length > 1;

                              return (
                                <div key={`${day}-${hour}`} className="min-h-14 flex flex-col gap-1">
                                  {lessons.map(cl => {
                                    const isPrep = cl.sector === Sector.PREPARATORY;
                                    return (
                                      <div
                                        key={cl.id}
                                        className={`p-1.5 rounded-xl border text-left relative flex flex-col justify-between h-full ${
                                          isCol
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                                            : isPrep
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-505 dark:text-indigo-400'
                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-505 dark:text-amber-400'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center">
                                          <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-black/10">
                                            {isPrep ? 'Pre' : 'Sec'}
                                          </span>
                                          <span className="text-[8px] text-gray-500 font-black">{cl.room}</span>
                                        </div>
                                        <div className="text-[10px] font-black truncate leading-tight mt-1">
                                          {cl.subject}
                                        </div>
                                        <div className="text-[8px] font-bold text-gray-500 truncate mt-0.5">
                                          Grupo: {cl.group}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-sm font-bold text-gray-500">
                Seleccione un docente para ver su análisis integrado de doble sector
              </div>
            )}
          </div>

          {/* 2. DUAL-SECTOR GENERAL TABLES WITH VIEWER CONTROLS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {combinedView ? 'Vista Integrada Completa: Maestros de Prepa y Secundaria' : `Vista de Nivel Unitario: ${sector}`}
              </h3>
              <p className="text-xs text-gray-400">
                {combinedView 
                  ? 'Mostrando la programación de todos los maestros en ambos sectores en una sola grilla de cruce' 
                  : `Mostrando alumnos y profesores asignados únicamente a ${sector}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                onClick={exportGeneralPDF}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-indigo-600 hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
              
              <button 
                onClick={exportGeneralExcel}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-emerald-600 hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
              >
                <Download size={14} />
                <span>Excel</span>
              </button>

              <button 
                onClick={handleRefresh}
                className={`flex items-center space-x-1.5 px-3 py-2.5 bg-indigo-600 hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all ${localRefreshing ? 'opacity-80 scale-95' : ''}`}
                title={language === 'es' ? 'Recargar Sistema' : 'Reload System'}
                disabled={localRefreshing}
              >
                <RefreshCw size={14} className={localRefreshing ? 'animate-spin' : ''} />
                <span>{localRefreshing ? (language === 'es' ? 'Cargando...' : 'Loading...') : (language === 'es' ? 'Actualizar' : 'Refresh')}</span>
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="text"
                  placeholder="Buscar maestro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500' : 'bg-white border-slate-200 text-slate-905 placeholder-gray-400'}`}
                />
              </div>

              {/* View toggle button */}
              <button
                onClick={() => setCombinedView(!combinedView)}
                className={`px-4 py-2.5 rounded-xl border font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-2 ${
                  combinedView 
                    ? `bg-indigo-500/10 border-indigo-500/30 text-indigo-500` 
                    : `${isDarkMode ? 'bg-gray-900 border-gray-850 text-gray-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'}`
                }`}
              >
                <GitCompare size={13} />
                {combinedView ? 'Desactivar Integración' : 'Activar Crossover'}
              </button>
            </div>
          </div>

          {/* Table container */}
          <div className={`w-full rounded-[2.5rem] border shadow-2xl overflow-hidden mb-10 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-950' : 'bg-slate-50'}>
                    <th className={`p-4 text-left text-[10px] font-black text-gray-400 uppercase w-48 border-r ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>Maestro</th>
                    {days.map(d => (
                      <th key={d} className={`p-4 text-center text-[10px] font-black uppercase text-gray-400 border-r last:border-r-0 ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-sm text-gray-500 font-bold">
                        Ningún docente coincide con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map(teacher => {
                      return (
                        <tr key={teacher.id} className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                          {/* Teacher general identity */}
                          <td className={`p-4 font-bold text-sm border-r sticky left-0 z-10 ${isDarkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-slate-900 border-slate-100'}`}>
                            <div className="flex flex-col">
                              <span>{teacher.name}</span>
                              <div className="text-[10px] text-gray-500 font-normal mt-1">{teacher.subject || 'Profesor'}</div>
                              {/* Display whether the teacher is dual-level in this list */}
                              {allClasses.some(c => c.teacher === teacher.name && c.sector === Sector.PREPARATORY) &&
                               allClasses.some(c => c.teacher === teacher.name && c.sector === Sector.SECONDARY) && (
                                 <span className="mt-1.5 inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                   🔄 Doble Nivel
                                 </span>
                               )}
                            </div>
                          </td>
                          
                          {/* Days mapping */}
                          {days.map(day => (
                            <td key={`${teacher.id}-${day}`} className={`p-2 border-r last:border-r-0 min-w-[210px] align-top ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                              <div className="flex flex-col gap-1.5">
                                {allHoursUnion.map(hour => {
                                  // Find lessons for this teacher, day and hour. If combinedView is off, restrict to current sector.
                                  const matchingClasses = allClasses.filter(c => 
                                    c.teacher === teacher.name && 
                                    c.day === day && 
                                    c.hour === hour &&
                                    (combinedView ? true : c.sector === sector)
                                  );

                                  if (matchingClasses.length === 0) return null;

                                  const hasCollision = matchingClasses.length > 1;

                                  return (
                                    <div key={`${day}-${hour}`} className="flex flex-col gap-1">
                                      {matchingClasses.map(cl => {
                                        const isPrep = cl.sector === Sector.PREPARATORY;
                                        return (
                                          <div
                                            key={cl.id}
                                            className={`p-2 rounded-xl border flex flex-col relative transition-all ${
                                              hasCollision
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-sm'
                                                : isPrep
                                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-505 dark:text-indigo-400'
                                                : 'bg-amber-500/10 border-amber-500/30 text-amber-505 dark:text-amber-400'
                                            }`}
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className="text-[10px] font-black font-mono text-gray-400">{hour}</span>
                                              <span className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded ${
                                                isPrep ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                                              }`}>
                                                {cl.sector === Sector.PREPARATORY ? 'Prepa' : 'Secundaria'}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-1">
                                              <span className="text-xs font-bold truncate flex-1 pr-2">{cl.subject}</span>
                                              <div className="text-right shrink-0">
                                                <div className="text-[9px] font-black text-indigo-500 leading-tight">{cl.group}</div>
                                                <div className="text-[8px] font-bold text-gray-500 leading-none">{cl.room}</div>
                                              </div>
                                            </div>

                                            {hasCollision && (
                                              <div className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-bl-lg">
                                                <AlertTriangle size={10} className="animate-pulse" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'comunidad' && (
        <Community 
          themeColor={themeColor} 
          isDarkMode={isDarkMode} 
          currentUser={currentUser} 
          teachers={availabilities} 
          messages={messages}
          onSendMessage={onSendMessage}
        />
      )}

      {activeTab === 'compartir' && (
        <Share 
          themeColor={themeColor} 
          isDarkMode={isDarkMode} 
          language={language} 
        />
      )}
    </div>
  );
};

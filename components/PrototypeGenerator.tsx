
import React, { useState } from 'react';
import { Wand2, AlertTriangle, CheckCircle2, MapPin, Book, Save, Trash2, Calendar, LayoutGrid, Clock, Loader2, Sparkles, Activity, Settings2, Sliders, Check, HelpCircle, Briefcase, Plus, X, Coffee, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Sector, ClassData, TeacherAvailability } from '../types';
import { CURRICULUM, PREPARATORY_ROOMS, SECONDARY_ROOMS } from '../constants';

const normalizeTeacherName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents and tildes (e.g. é -> e, í -> i)
    .replace(/\s+/g, " ")            // collapse multi-spaces to single space
    .trim();
};

const createSlotsTracker = (initial?: Record<string, string[]>): Record<string, string[]> => {
  const target: Record<string, string[]> = {};
  
  if (initial) {
    for (const key in initial) {
      const normKey = normalizeTeacherName(key);
      if (!target[normKey]) {
        target[normKey] = [];
      }
      target[normKey] = Array.from(new Set([...target[normKey], ...initial[key]]));
    }
  }

  return new Proxy(target, {
    get(obj, prop) {
      if (typeof prop === 'string') {
        const normKey = normalizeTeacherName(prop);
        if (!(normKey in obj)) {
          obj[normKey] = [];
        }
        return obj[normKey];
      }
      return Reflect.get(obj, prop);
    },
    set(obj, prop, value) {
      if (typeof prop === 'string') {
        const normKey = normalizeTeacherName(prop);
        obj[normKey] = value;
        return true;
      }
      return Reflect.set(obj, prop, value);
    },
    has(obj, prop) {
      if (typeof prop === 'string') {
        const normKey = normalizeTeacherName(prop);
        return normKey in obj;
      }
      return Reflect.has(obj, prop);
    },
    ownKeys(obj) {
      return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj, prop) {
      return Reflect.getOwnPropertyDescriptor(obj, prop);
    }
  });
};

interface PrototypeProps {
  sector: Sector;
  themeColor: string;
  isDarkMode: boolean;
  availabilities: TeacherAvailability[];
  allClasses: ClassData[];
  onUpdateClasses: (classes: ClassData[]) => Promise<void> | void;
  onNavigateToScheduler: (room: string) => void;
  hours: string[];
  recesses?: string[];
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

const getBaseSubjectName = (sub: string) => sub.replace(/\s*[IVX]+$/, '').trim().toLowerCase();

const isSimultaneousLimitExceeded = (subject: string, day: string, hour: string, currentClasses: ClassData[], optLimit: boolean) => {
  if (!optLimit) return false;
  const baseSub = getBaseSubjectName(subject);
  let count = 0;
  for (let i = 0; i < currentClasses.length; i++) {
    const c = currentClasses[i];
    if (c.day === day && c.hour === hour) {
      if (getBaseSubjectName(c.subject) === baseSub) {
        count++;
        if (count >= 2) return true; // Limit max 2 of the same subject across the school at the same time
      }
    }
  }
  return false;
};

export const PrototypeGenerator: React.FC<PrototypeProps> = ({
  sector,
  themeColor,
  isDarkMode,
  availabilities,
  allClasses,
  onUpdateClasses,
  onNavigateToScheduler,
  hours,
  recesses = []
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPrototype, setIsSavingPrototype] = useState(false);
  
  // Progress & Countdown Trackers
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveTimeLeft, setSaveTimeLeft] = useState(6);
  const [saveStepText, setSaveStepText] = useState("");

  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationTimeLeft, setGenerationTimeLeft] = useState(3);
  const [generationStepText, setGenerationStepText] = useState("");

  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [stagedClasses, setStagedClasses] = useState<ClassData[] | null>(null);
  const [viewMode, setViewMode] = useState<'generator' | 'general'>('generator');
  
  
  // AI Constraint Optimization Preferences
  const [optDoubleSessions, setOptDoubleSessions] = useState(true);
  const [optBalanceTeachers, setOptBalanceTeachers] = useState(true);
  const [optNoGaps, setOptNoGaps] = useState(true);
  const [optDynamicRecesses, setOptDynamicRecesses] = useState(true);
  const [optSimultaneousLimit, setOptSimultaneousLimit] = useState(true);
  const [optEnglishBlocks, setOptEnglishBlocks] = useState(true);
  
  // Semesters to generate (for PREPARATORY sector)
  const [genSemesters, setGenSemesters] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  
  // Interactive cell editing state
  const [editingCell, setEditingCell] = useState<{ day: string; hour: string; classItem: ClassData } | null>(null);
  
  // Local toast message state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'amber' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'amber' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };
  
  // Configuration states
  const [selectedSem, setSelectedSem] = useState<number>(1);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  const [previewSem, setPreviewSem] = useState<number>(1);
  const [previewGroup, setPreviewGroup] = useState<string>('A');

  const vibrant = getVibrantColor(themeColor);
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const sectorConfig = CURRICULUM[sector];

  // Logic to determine available groups and rooms based on selection
  const availableGroups = sector === Sector.PREPARATORY 
    ? (sectorConfig as any).groups[selectedSem] 
    : (sectorConfig as any).groups;

  React.useEffect(() => {
    if (availableGroups && !availableGroups.includes(selectedGroup)) {
      setSelectedGroup(availableGroups[0] || '');
    }
  }, [availableGroups, selectedGroup]);

  // Sync room name with selection
  React.useEffect(() => {
    if (sector === Sector.PREPARATORY) {
      const newRoom = `SEMESTRE ${selectedSem} - ${selectedGroup}`;
      
      if (PREPARATORY_ROOMS.includes(newRoom)) {
        setSelectedRoom(newRoom);
      } else {
        setSelectedRoom(PREPARATORY_ROOMS[0]);
      }
    } else {
       // Simple mapping for secondary
       const idx = (sectorConfig as any).groups.indexOf(selectedGroup);
       if (idx !== -1 && idx < SECONDARY_ROOMS.length) {
         setSelectedRoom(SECONDARY_ROOMS[idx]);
       } else {
         setSelectedRoom(SECONDARY_ROOMS[0]);
       }
    }
  }, [selectedSem, selectedGroup, sector, sectorConfig]);

  const _generateForGroup = (groupName: string, semester: number, room: string, currentClasses: ClassData[], teacherSlotsTaken: Record<string, string[]>, recessesTakenCounts: Record<string, number> = {}) => {
    let groupHours = hours;
    let groupRecessesList = recesses;
    
    // Override hours for PREPARATORY sector based on semester
    if (sector === Sector.PREPARATORY) {
      groupHours = [
        '7:20 - 8:10', '8:10 - 9:00', '9:00 - 9:50', '9:50 - 10:40',
        '10:40 - 11:30', '11:30 - 12:20', '12:20 - 13:10', '13:10 - 13:20', '13:20 - 14:10'
      ];
      groupRecessesList = ['13:10 - 13:20'];
    }

    return ((hours, recesses) => {
      let subjectsToAssign: string[] = [];

    if (sector === Sector.PREPARATORY) {
      subjectsToAssign = [...(sectorConfig as any).semesters[semester]];
      if (semester === 1 || semester === 2 || semester === 3 || semester === 4 || semester === 5 || semester === 6) {
        if (!subjectsToAssign.includes('Taller Cultural')) {
          subjectsToAssign.push('Taller Cultural');
        }
      }
      
      // Assign deterministic specialty & area classes based on group name to guarantee variety and zero conflicts
      if (semester === 4 || semester === 6) {
        const specialities = (sectorConfig as any).specialties;
        const specIndex = groupName.charCodeAt(groupName.length - 1) % specialities.length;
        subjectsToAssign.push(specialities[specIndex]);
      }
      if (semester === 6) {
        const areas = (sectorConfig as any).areas;
        const areaIndex = groupName.charCodeAt(groupName.length - 1) % areas.length;
        subjectsToAssign.push(areas[areaIndex]);
      }
    } else {
      const gradeDigit = parseInt(groupName.charAt(0)) || 1;
      const secondaryConfig = sectorConfig as any;
      if (secondaryConfig.grades && secondaryConfig.grades[gradeDigit]) {
        subjectsToAssign = [...secondaryConfig.grades[gradeDigit]];
      } else {
        subjectsToAssign = [...secondaryConfig.subjects];
      }
    }

    // Dynamic Staggered Breaks Configuration per Group/Room
    const hashKey = `${room || groupName || ''}`;
    let charSum = 0;
    for (let i = 0; i < hashKey.length; i++) {
      charSum += hashKey.charCodeAt(i);
    }
    const groupIndex = charSum;

    const H = hours.length;
    let groupRecesses: string[] = [];
    
    // Validate whether an hour/index is strictly forbidden from being a recess (first class, last class, workshops, clubs)
    const isForbiddenRecess = (hourName: string, index: number) => {
      if (index === 0) return true;
      if (index === H - 1) return true;
      if (hourName === '7:00' || hourName === '8:00') return true;
      if (recesses.includes(hourName)) return true;
      return false;
    };

    if (optDynamicRecesses) {
      // Find the second recess within the hours array (e.g. 13:10, 1:10)
      let secondRecessTimeStr = hours.find(h => h.includes('13:10') || h.includes('1:10')) || hours.find(h => h.includes('13:00')) || hours[H - 3] || hours[4];
      const secondRecessIdx = hours.indexOf(secondRecessTimeStr);

      let validFirstRecesses: number[] = [];
      for (let i = 1; i < H - 2; i++) {
        if (isForbiddenRecess(hours[i], i)) continue;
        if (i >= secondRecessIdx) continue; // First recess must be before the second recess
        // Ensure 1 or 2 classes distance between first recess and second recess
        const distanceToSecond = secondRecessIdx - i - 1; 
        if (distanceToSecond < 1 || distanceToSecond > 3) continue; 
        if (i < 1 || i > 3) continue; // 1 to 3 classes of difference after starting classes
        validFirstRecesses.push(i);
      }

      if (validFirstRecesses.length > 0) {
        validFirstRecesses.sort((a, b) => {
          const loadA = recessesTakenCounts[hours[a]] || 0;
          const loadB = recessesTakenCounts[hours[b]] || 0;
          // Prefer 3 blocks distance
          const diffA = Math.abs((secondRecessIdx - a) - 3);
          const diffB = Math.abs((secondRecessIdx - b) - 3);
          return (loadA * 10 + diffA) - (loadB * 10 + diffB);
        });

        // Filter valid recesses without too much load
        const strictValid = validFirstRecesses.filter(idx => (recessesTakenCounts[hours[idx]] || 0) < 3);
        const bestFirst = strictValid.length > 0 ? strictValid[0] : validFirstRecesses[0];
        
        groupRecesses = [hours[bestFirst]];
      } else {
        const firstIdx = Math.min(3, H - 4);
        groupRecesses = [hours[firstIdx]];
      }
    }

    groupRecesses.forEach(h => {
      if (h && !recesses.includes(h)) {
        recessesTakenCounts[h] = (recessesTakenCounts[h] || 0) + 1;
      }
    });

    const activeHours = hours.filter(h => !recesses.includes(h) && !groupRecesses.includes(h));
    const totalSlots = days.length * activeHours.length; // usually 30 slots after removing 2 recess slots per day
    
    // Calculate targeted school hour requirements per subject dynamically (Curriculum Alignment)
    const targets: Record<string, number> = {};
    const isEnglish = (s: string) => {
      const lower = s.toLowerCase();
      return lower.includes('inglés') || lower.includes('ingles');
    };
    const isFormacionDeTrabajo = (s: string) => {
      const lower = s.toLowerCase();
      return lower.includes('formación de trabajo') || lower.includes('formacion de trabajo') || lower.includes('formación para el trabajo') || lower.includes('formacion para el trabajo');
    };

    let sub1: string | undefined = undefined;
    let sub2: string | undefined = undefined;

    if (sector === Sector.PREPARATORY) {
      const englishSub = subjectsToAssign.find(isEnglish);
      const formacionSub = subjectsToAssign.find(isFormacionDeTrabajo);
      
      const isSub1 = (s: string) => {
        const lower = s.toLowerCase();
        return lower.includes('submódulo i') || lower.includes('submódulo iii') || lower.includes('submódulo v') || lower.includes('submódulo vii') ||
               lower.includes('submodulo i') || lower.includes('submodulo iii') || lower.includes('submodulo v') || lower.includes('submodulo vii');
      };
      const isSub2 = (s: string) => {
        const lower = s.toLowerCase();
        return lower.includes('submódulo ii') || lower.includes('submódulo iv') || lower.includes('submódulo vi') || lower.includes('submódulo viii') ||
               lower.includes('submodulo ii') || lower.includes('submodulo iv') || lower.includes('submodulo vi') || lower.includes('submodulo viii');
      };
      
      sub1 = subjectsToAssign.find(isSub1);
      sub2 = subjectsToAssign.find(isSub2);

      const remainingSubjects = subjectsToAssign.filter(sub => 
        !isEnglish(sub) && 
        sub !== 'Taller Cultural' && 
        !isFormacionDeTrabajo(sub) &&
        !isSub1(sub) &&
        !isSub2(sub)
      );
      
      let englishTarget = 0;
      if (englishSub) {
        if (semester === 1 || semester === 2) {
          englishTarget = 5;
        } else {
          englishTarget = 3;
        }
        targets[englishSub] = englishTarget;
      }

      let culturalTarget = 0;
      if (semester === 1 || semester === 2 || semester === 3 || semester === 4) {
        culturalTarget = 2;
        targets['Taller Cultural'] = 2;
      } else if (semester === 5 || semester === 6) {
        culturalTarget = 1;
        targets['Taller Cultural'] = 1;
      }

      let formacionTarget = 0;
      if (formacionSub && (semester === 3 || semester === 4)) {
        formacionTarget = 5;
        targets[formacionSub] = 5;
      }

      let submodulesTarget = 0;
      if (semester === 3 || semester === 4 || semester === 5 || semester === 6) {
        if (sub1) {
          targets[sub1] = 5;
          submodulesTarget += 5;
        }
        if (sub2) {
          targets[sub2] = 4;
          submodulesTarget += 4;
        }
      }
      
      const remainingSlots = Math.max(0, totalSlots - englishTarget - culturalTarget - formacionTarget - submodulesTarget);
      const remN = remainingSubjects.length;
      if (remN > 0) {
        const base = Math.floor(remainingSlots / remN);
        let remainder = remainingSlots % remN;
        
        remainingSubjects.forEach(sub => {
          targets[sub] = base;
        });
        
        const isCore = (sub: string) => {
          const name = sub.toLowerCase();
          return name.includes('matemát') || name.includes('lengua') || name.includes('español') || name.includes('ciencias');
        };
        
        const sortedSubjects = [...remainingSubjects].sort((a, b) => {
          if (isCore(a) && !isCore(b)) return -1;
          if (!isCore(a) && isCore(b)) return 1;
          return 0;
        });
        
        for (let i = 0; i < remainder; i++) {
          const sub = sortedSubjects[i % sortedSubjects.length];
          targets[sub]++;
        }
      }
    } else {
      const n = subjectsToAssign.length;
      if (n > 0) {
        let base = Math.floor(totalSlots / n);
        let remainder = totalSlots % n;

        subjectsToAssign.forEach(sub => {
          targets[sub] = base;
        });

        targets['Taller Cultural'] = 2;
        const normalSubjects = subjectsToAssign.filter(sub => sub !== 'Taller Cultural');
        const remainingSlots = Math.max(0, totalSlots - 2);
        if (normalSubjects.length > 0) {
          base = Math.floor(remainingSlots / normalSubjects.length);
          remainder = remainingSlots % normalSubjects.length;
          normalSubjects.forEach(sub => {
            targets[sub] = base;
          });
        }

        const isCore = (sub: string) => {
          const name = sub.toLowerCase();
          return name.includes('matemát') || name.includes('lengua') || name.includes('español') || name.includes('inglés') || name.includes('ciencias');
        };

        const sortedSubjects = [...subjectsToAssign.filter(sub => sub !== 'Taller Cultural')].sort((a, b) => {
          if (isCore(a) && !isCore(b)) return -1;
          if (!isCore(a) && isCore(b)) return 1;
          return 0;
        });

        if (sortedSubjects.length > 0) {
          for (let i = 0; i < remainder; i++) {
            const sub = sortedSubjects[i % sortedSubjects.length];
            targets[sub]++;
          }
        }
      }
    }

    let groupScheduleMap = new Map<string, ClassData>(); // Key: `${day}_${hour}`
    let assignedSubjectHours: Record<string, number> = {};
    subjectsToAssign.forEach(sub => assignedSubjectHours[sub] = 0);

    let teacherGroupLoad: Record<string, number> = {};
    availabilities.forEach(t => teacherGroupLoad[t.name] = 0);

    // Helpers to check workshops vs clubs
    const isWorkshop = (s: string) => s.includes('Talleres:');
    const isClub = (s: string) => s.includes('Clubes:');
    const findEnglishTeacher = (subName: string): string => {
      const found = availabilities.find(t => 
        t.subject?.toLowerCase().includes('inglés') || 
        t.subject?.toLowerCase().includes('ingles') || 
        (t.subjects && t.subjects.some(s => s.toLowerCase().includes('inglés') || s.toLowerCase().includes('ingles')))
      );
      return found ? found.name : 'Profesor de Inglés';
    };

    // Rule A: Capacidad de Aulas Especiales (Laboratorios, Talleres, Canchas)
    const isSpecialRoomSubject = (sub: string) => {
      const lower = sub.toLowerCase();
      return lower.includes('laboratorio') || 
             lower.includes('taller') || 
             lower.includes('club') || 
             lower.includes('educación física') || 
             lower.includes('música') || 
             lower.includes('artes') || 
             lower.includes('teatro');
    };

    const isSpecialRoomOccupied = (sub: string, targetDay: string, targetHour: string) => {
      if (!isSpecialRoomSubject(sub)) return false;
      return currentClasses.some(c => 
        isSpecialRoomSubject(c.subject) && 
        c.subject === sub && 
        c.day === targetDay && 
        c.hour === targetHour
      );
    };

    // Rule B: Profesores Compartidos - Building Coherence, Anti-Ping-Pong & Transfer Margins
    const getTeacherSectorPenalty = (teacherName: string, targetDay: string, targetHour: string, mapToUse: Map<string, ClassData> = groupScheduleMap) => {
      const teacherClassesOfDay = [
         ...currentClasses.filter(c => c.teacher === teacherName && c.day === targetDay),
         ...Array.from(mapToUse.values()).filter(c => c.teacher === teacherName && c.day === targetDay)
      ];
      if (teacherClassesOfDay.length === 0) return 0;

      const currentHourIdx = hours.indexOf(targetHour);
      if (currentHourIdx === -1) return 0;

      const sortedSlots = teacherClassesOfDay
        .map(c => ({
          hourIdx: hours.indexOf(c.hour),
          sector: c.sector
        }))
        .filter(x => x.hourIdx !== -1);

      // Analyze adding this slot
      sortedSlots.push({ hourIdx: currentHourIdx, sector });
      sortedSlots.sort((a, b) => a.hourIdx - b.hourIdx);

      let penalty = 0;
      let sectorChanges = 0;
      for (let i = 1; i < sortedSlots.length; i++) {
        if (sortedSlots[i].sector !== sortedSlots[i-1].sector) {
          sectorChanges++;
          const gap = sortedSlots[i].hourIdx - sortedSlots[i-1].hourIdx;
          if (gap === 1) {
            penalty += 1200; // Strict penalty for lack of transfer margin (back-to-back classes)
          } else {
            // Check if there is a recess in the modules between their transition
            let containsRecess = false;
            for (let g = sortedSlots[i-1].hourIdx + 1; g < sortedSlots[i].hourIdx; g++) {
              if (recesses.includes(hours[g])) {
                containsRecess = true;
                break;
              }
            }
            if (!containsRecess) {
              penalty += 150; // Small penalty for transferring during regular hours instead of recess
            }
          }
        }
      }

      if (sectorChanges > 1) {
        penalty += 2500; // Strict anti-ping-pong penalty to ensure max 1 sector swap daily
      }

      return penalty;
    };

    // Rule C: Limit teacher windows (ventanas de horas libres para el docente)
    const getTeacherWindowPenalty = (teacherName: string, targetDay: string, targetHour: string, mapToUse: Map<string, ClassData> = groupScheduleMap) => {
      const teacherClassesOfDay = [
        ...currentClasses.filter(c => c.teacher === teacherName && c.day === targetDay),
        ...Array.from(mapToUse.values()).filter(c => c.teacher === teacherName && c.day === targetDay)
      ];
      if (teacherClassesOfDay.length < 1) return 0;

      const currentHourIdx = hours.indexOf(targetHour);
      if (currentHourIdx === -1) return 0;

      const indices = teacherClassesOfDay
        .map(c => hours.indexOf(c.hour))
        .filter(idx => idx !== -1);
      
      indices.push(currentHourIdx);
      indices.sort((a, b) => a - b);

      const minIdx = indices[0];
      const maxIdx = indices[indices.length - 1];

      const totalSpan = maxIdx - minIdx + 1;
      const classesCount = indices.length;
      const gaps = totalSpan - classesCount;

      if (gaps > 2) {
        return 300;
      } else if (gaps > 1) {
        return 100;
      }
      return 0;
    };

    // Rule D: Cognitive and Weekly Spread / Last Hour Balancing
    const isHeavySubject = (sub: string) => {
      const lower = sub.toLowerCase();
      return lower.includes('matemát') || 
             lower.includes('físic') || 
             lower.includes('químic') || 
             lower.includes('biolog') || 
             lower.includes('laboratorio') || 
             lower.includes('inglés');
    };

    const isDynamicSubject = (sub: string) => {
      const lower = sub.toLowerCase();
      return lower.includes('educación física') || 
             lower.includes('artes') || 
             lower.includes('música') || 
             lower.includes('teatro') || 
             lower.includes('tutoría') || 
             lower.includes('socioemocional') ||
             lower.includes('clubes') ||
             lower.includes('taller');
    };

    const getCognitiveLoadPenalty = (subject: string, targetDay: string, targetHour: string, mapToUse: Map<string, ClassData> = groupScheduleMap) => {
      let penalty = 0;
      const hIdx = hours.indexOf(targetHour);
      if (hIdx === -1) return 0;

      // Avoid 3 heavy subjects in a row
      if (isHeavySubject(subject)) {
        let consecutiveHeavy = 0;
        if (hIdx > 0) {
          const prevHour1 = hours[hIdx - 1];
          const c1 = mapToUse.get(`${targetDay}_${prevHour1}`);
          if (c1 && isHeavySubject(c1.subject)) {
            consecutiveHeavy++;
            if (hIdx > 1) {
              const prevHour2 = hours[hIdx - 2];
              const c2 = mapToUse.get(`${targetDay}_${prevHour2}`);
              if (c2 && isHeavySubject(c2.subject)) {
                consecutiveHeavy++;
              }
            }
          }
        }
        if (consecutiveHeavy >= 2) {
          penalty += 150;
        }
      }

      // Balance last lesson module
      const isLastHour = hIdx === hours.length - 1;
      if (isLastHour) {
        if (isHeavySubject(subject)) {
          penalty += 200;
        } else if (isDynamicSubject(subject)) {
          penalty -= 50; // Boost dynamic options
        }
      }

      return penalty;
    };

    const getSubjectClusteringPenalty = (subject: string, targetDay: string, mapToUse: Map<string, ClassData> = groupScheduleMap) => {
      const dayIndex = days.indexOf(targetDay);
      const classes = Array.from(mapToUse.values());
      
      let penalty = 0;
      classes.forEach(c => {
        if (c.subject === subject) {
          if (c.day === targetDay) {
            penalty += 80; // Weekly dispersion penalty for same-day
          } else {
            const diff = Math.abs(days.indexOf(c.day) - dayIndex);
            if (diff === 1) {
              penalty += 15; // Small penalty for consecutive days
            }
          }
        }
      });
      return penalty;
    };

    // 100 Trial Simulation Loop to find optimal layout with MINIMUM blank spaces
    let bestGroupScheduleMap = new Map<string, ClassData>();
    let bestAssignedSubjectHours: Record<string, number> = {};
    let bestTeacherGroupLoad: Record<string, number> = {};
    let bestTeacherSlotsTaken = createSlotsTracker();
    let bestRecessesTakenCounts: Record<string, number> = {};
    let minBlankSpaces = 100;

    for (let trial = 0; trial < 100; trial++) {
      const trialMap = new Map<string, ClassData>();
      const trialAssignedSubjectHours: Record<string, number> = {};
      subjectsToAssign.forEach(sub => trialAssignedSubjectHours[sub] = 0);

      const trialTeacherGroupLoad: Record<string, number> = {};
      availabilities.forEach(t => trialTeacherGroupLoad[t.name] = 0);

      const trialTeacherSlotsTaken = createSlotsTracker(teacherSlotsTaken);

      const trialRecessesTakenCounts = { ...recessesTakenCounts };

      // Helper for fixed curriculum slots (workshops & clubs)
      const trialScheduledFixed = (subject: string, targetDay: string, targetHours: string[]) => {
        const canExecute = targetHours.every(h => {
          return !isSimultaneousLimitExceeded(subject, targetDay, h, currentClasses, optSimultaneousLimit);
        });

        if (!canExecute) return;

        let matchingTeachers = availabilities.filter(t => {
          const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
          if (!matchesSub) return false;
          return targetHours.every(h => {
            const slotStr = `${targetDay}-${h}`;
            return t.slots.includes(slotStr) && !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
          });
        });

        if (matchingTeachers.length === 0) {
          matchingTeachers = availabilities.filter(t => {
            return targetHours.every(h => {
              const slotStr = `${targetDay}-${h}`;
              return t.slots.includes(slotStr) && !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
            });
          });
        }

        if (matchingTeachers.length > 0) {
          if (optBalanceTeachers) {
            matchingTeachers.sort((x, y) => (trialTeacherGroupLoad[x.name] || 0) - (trialTeacherGroupLoad[y.name] || 0));
          }
          const selectedTeacher = matchingTeachers[0];

          targetHours.forEach(h => {
            const slotStr = `${targetDay}-${h}`;
            const newClass: ClassData = {
              id: Math.random().toString(36).substr(2, 9),
              subject,
              teacher: selectedTeacher.name,
              room,
              day: targetDay,
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(`${targetDay}_${h}`, newClass);
            
            if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
            trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
            trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
          });

          trialAssignedSubjectHours[subject] = targetHours.length;
        }
      };

      const workshopSubject = subjectsToAssign.find(isWorkshop);
      if (workshopSubject) {
        const wedHours = hours.filter(h => h.startsWith('7:00') || h.startsWith('8:00') || h.startsWith('07:00') || h.startsWith('08:00'));
        trialScheduledFixed(workshopSubject, 'Miércoles', wedHours.length ? wedHours : ['7:00-8:00', '8:00-9:00']);
      }

      const clubSubject = subjectsToAssign.find(isClub);
      if (clubSubject) {
        const thuHours = hours.filter(h => h.startsWith('7:00') || h.startsWith('8:00') || h.startsWith('07:00') || h.startsWith('08:00'));
        trialScheduledFixed(clubSubject, 'Jueves', thuHours.length ? thuHours : ['7:00-8:00', '8:00-9:00']);
      }

      // Pre-schedule English Blocks with fixed days and hours for PREPARATORY
      if (optEnglishBlocks && sector === Sector.PREPARATORY) {
        const englishSubject = subjectsToAssign.find(isEnglish);
        if (englishSubject) {
          const englishHours: { day: string, hour: string }[] = [];
          let expectedHours = 0;

          if (semester === 1) {
            expectedHours = 5;
            englishHours.push({ day: 'Lunes', hour: '7:20 - 8:10' });
            englishHours.push({ day: 'Lunes', hour: '8:10 - 9:00' });
            englishHours.push({ day: 'Jueves', hour: '7:20 - 8:10' });
            englishHours.push({ day: 'Jueves', hour: '8:10 - 9:00' });
            englishHours.push({ day: 'Miércoles', hour: '7:20 - 8:10' });
          } else if (semester === 2) {
            expectedHours = 5;
            englishHours.push({ day: 'Lunes', hour: '9:00 - 9:50' });
            englishHours.push({ day: 'Lunes', hour: '9:50 - 10:40' });
            englishHours.push({ day: 'Jueves', hour: '9:00 - 9:50' });
            englishHours.push({ day: 'Jueves', hour: '9:50 - 10:40' });
            englishHours.push({ day: 'Miércoles', hour: '9:00 - 9:50' });
          } else if (semester === 3) {
            expectedHours = 3;
            englishHours.push({ day: 'Lunes', hour: '10:40 - 11:30' });
            englishHours.push({ day: 'Lunes', hour: '11:30 - 12:20' });
            englishHours.push({ day: 'Jueves', hour: '10:40 - 11:30' });
          } else if (semester === 4) {
            expectedHours = 3;
            englishHours.push({ day: 'Miércoles', hour: '9:50 - 10:40' });
            englishHours.push({ day: 'Miércoles', hour: '10:40 - 11:30' });
            englishHours.push({ day: 'Jueves', hour: '7:20 - 8:10' });
          } else if (semester === 5) {
            expectedHours = 3;
            englishHours.push({ day: 'Jueves', hour: '7:20 - 8:10' });
            englishHours.push({ day: 'Jueves', hour: '8:10 - 9:00' });
            englishHours.push({ day: 'Viernes', hour: '7:20 - 8:10' });
          } else if (semester === 6) {
            expectedHours = 3;
            englishHours.push({ day: 'Jueves', hour: '7:20 - 8:10' });
            englishHours.push({ day: 'Jueves', hour: '8:10 - 9:00' });
            englishHours.push({ day: 'Viernes', hour: '8:10 - 9:00' });
          }

          if (expectedHours > 0) {
            const englishTeacherName = findEnglishTeacher(englishSubject);
            let assignedEnglishCount = 0;

            englishHours.forEach(slot => {
              if (isSimultaneousLimitExceeded(englishSubject, slot.day, slot.hour, currentClasses, optSimultaneousLimit)) return;

              const slotKey = `${slot.day}_${slot.hour}`;
              const slotStr = `${slot.day}-${slot.hour}`;
              const newClass: ClassData = {
                id: `eng-${Math.random().toString(36).substr(2, 9)}`,
                subject: englishSubject,
                teacher: englishTeacherName,
                room,
                day: slot.day,
                hour: slot.hour,
                sector,
                group: groupName
              };
              trialMap.set(slotKey, newClass);
              
              if (!trialTeacherSlotsTaken[englishTeacherName]) {
                trialTeacherSlotsTaken[englishTeacherName] = [];
              }
              trialTeacherSlotsTaken[englishTeacherName].push(slotStr);
              trialTeacherGroupLoad[englishTeacherName] = (trialTeacherGroupLoad[englishTeacherName] || 0) + 1;
              assignedEnglishCount++;
            });

            trialAssignedSubjectHours[englishSubject] = assignedEnglishCount;
          }
        }
      }

      // Pre-schedule Taller Cultural on different days
      if (sector === Sector.PREPARATORY && (semester === 1 || semester === 2 || semester === 3 || semester === 4 || semester === 5 || semester === 6)) {
        const culturalSubject = 'Taller Cultural';
        const culturalHours: string[] = [];
        let culturalDay = 'Viernes';
        
        if (semester === 1) {
          culturalDay = 'Viernes';
          culturalHours.push('10:40 - 11:30');
          culturalHours.push('11:30 - 12:20');
        } else if (semester === 2) {
          culturalDay = 'Jueves';
          culturalHours.push('10:40 - 11:30');
          culturalHours.push('11:30 - 12:20');
        } else if (semester === 3 || semester === 4) {
          culturalDay = 'Martes';
          culturalHours.push('7:20 - 8:10');
          culturalHours.push('8:10 - 9:00');
        } else if (semester === 5 || semester === 6) {
          culturalDay = 'Miércoles';
          culturalHours.push('7:20 - 8:10');
        }
        
        const instructorName = `Profesor de Taller Cultural (${groupName})`;
        let assignedCulturalCount = 0;
        
        culturalHours.forEach(h => {
          if (isSimultaneousLimitExceeded(culturalSubject, culturalDay, h, currentClasses, optSimultaneousLimit)) return;

          const slotKey = `${culturalDay}_${h}`;
          const slotStr = `${culturalDay}-${h}`;
          const newClass: ClassData = {
            id: `cult-${Math.random().toString(36).substr(2, 9)}`,
            subject: culturalSubject,
            teacher: instructorName,
            room,
            day: culturalDay,
            hour: h,
            sector,
            group: groupName
          };
          trialMap.set(slotKey, newClass);
          
          if (!trialTeacherSlotsTaken[instructorName]) {
            trialTeacherSlotsTaken[instructorName] = [];
          }
          trialTeacherSlotsTaken[instructorName].push(slotStr);
          trialTeacherGroupLoad[instructorName] = (trialTeacherGroupLoad[instructorName] || 0) + 1;
          assignedCulturalCount++;
        });
        
        trialAssignedSubjectHours[culturalSubject] = assignedCulturalCount;
      }

      // Pre-schedule Formación de Trabajo for PREPARATORY Semesters 3 and 4
      if (sector === Sector.PREPARATORY && (semester === 3 || semester === 4)) {
        const formacionSubject = subjectsToAssign.find(isFormacionDeTrabajo);
        if (formacionSubject) {
          const formacionTeacherName = `Profesor de Formación de Trabajo (${groupName})`;
          let assignedFtCount = 0;
          
          days.forEach(day => {
            const h = activeHours[activeHours.length - 1]; // last active hour
            if (!h || isSimultaneousLimitExceeded(formacionSubject, day, h, currentClasses, optSimultaneousLimit)) return;

            const slotKey = `${day}_${h}`;
            const slotStr = `${day}-${h}`;
            
            const newClass: ClassData = {
              id: `ft-${Math.random().toString(36).substr(2, 9)}`,
              subject: formacionSubject,
              teacher: formacionTeacherName,
              room,
              day,
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(slotKey, newClass);
            
            if (!trialTeacherSlotsTaken[formacionTeacherName]) {
              trialTeacherSlotsTaken[formacionTeacherName] = [];
            }
            trialTeacherSlotsTaken[formacionTeacherName].push(slotStr);
            trialTeacherGroupLoad[formacionTeacherName] = (trialTeacherGroupLoad[formacionTeacherName] || 0) + 1;
            assignedFtCount++;
          });
          
          trialAssignedSubjectHours[formacionSubject] = assignedFtCount; // Updated count
        }
      }

      // Pre-schedule Vocational Submodules for PREPARATORY Semesters 5 and 6
      if (sector === Sector.PREPARATORY && (semester === 5 || semester === 6)) {
        if (sub1 && sub2) {
          const sub1TeacherName = `Profesor de ${sub1} (${groupName})`;
          const sub2TeacherName = `Profesor de ${sub2} (${groupName})`;
          
          const maxH = activeHours.length;
          const hEnd1 = activeHours[maxH - 1]; // Hour 7 (last)
          const hEnd2 = activeHours[maxH - 2]; // Hour 6
          const hBeforeEnd = activeHours[maxH - 3]; // Hour 5
          
          let assignedSub1 = 0;
          let assignedSub2 = 0;

          // Monday (Lunes): sub2 (2 hours: last two)
          const monSlots = [hEnd2, hEnd1];
          monSlots.forEach(h => {
            if (!h || isSimultaneousLimitExceeded(sub2, 'Lunes', h, currentClasses, optSimultaneousLimit)) return;
            const slotKey = `Lunes_${h}`;
            const slotStr = `Lunes-${h}`;
            const newClass: ClassData = {
              id: `sub-${Math.random().toString(36).substr(2, 9)}`,
              subject: sub2,
              teacher: sub2TeacherName,
              room,
              day: 'Lunes',
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(slotKey, newClass);
            if (!trialTeacherSlotsTaken[sub2TeacherName]) trialTeacherSlotsTaken[sub2TeacherName] = [];
            trialTeacherSlotsTaken[sub2TeacherName].push(slotStr);
            trialTeacherGroupLoad[sub2TeacherName] = (trialTeacherGroupLoad[sub2TeacherName] || 0) + 1;
            assignedSub2++;
          });
          
          // Wednesday (Miércoles): sub1 (1 hour: hBeforeEnd)
          const wedSlots = [hBeforeEnd];
          wedSlots.forEach(h => {
             if (!h || isSimultaneousLimitExceeded(sub1, 'Miércoles', h, currentClasses, optSimultaneousLimit)) return;
            const slotKey = `Miércoles_${h}`;
            const slotStr = `Miércoles-${h}`;
            const newClass: ClassData = {
              id: `sub-${Math.random().toString(36).substr(2, 9)}`,
              subject: sub1,
              teacher: sub1TeacherName,
              room,
              day: 'Miércoles',
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(slotKey, newClass);
            if (!trialTeacherSlotsTaken[sub1TeacherName]) trialTeacherSlotsTaken[sub1TeacherName] = [];
            trialTeacherSlotsTaken[sub1TeacherName].push(slotStr);
            trialTeacherGroupLoad[sub1TeacherName] = (trialTeacherGroupLoad[sub1TeacherName] || 0) + 1;
            assignedSub1++;
          });
          
          // Thursday (Jueves): sub2 (2 hours: hEnd4, hBeforeEnd)
          const hEnd4 = activeHours[maxH - 4] || activeHours[0];
          const thuSub2Slots = [hEnd4, hBeforeEnd];
          thuSub2Slots.forEach(h => {
            if (!h || isSimultaneousLimitExceeded(sub2, 'Jueves', h, currentClasses, optSimultaneousLimit)) return;
            const slotKey = `Jueves_${h}`;
            const slotStr = `Jueves-${h}`;
            const newClass: ClassData = {
              id: `sub-${Math.random().toString(36).substr(2, 9)}`,
              subject: sub2,
              teacher: sub2TeacherName,
              room,
              day: 'Jueves',
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(slotKey, newClass);
            if (!trialTeacherSlotsTaken[sub2TeacherName]) trialTeacherSlotsTaken[sub2TeacherName] = [];
            trialTeacherSlotsTaken[sub2TeacherName].push(slotStr);
            trialTeacherGroupLoad[sub2TeacherName] = (trialTeacherGroupLoad[sub2TeacherName] || 0) + 1;
            assignedSub2++;
          });

          // Thursday (Jueves): sub1 (2 hours: last two)
          const thuSub1Slots = [hEnd2, hEnd1];
          thuSub1Slots.forEach(h => {
            if (!h || isSimultaneousLimitExceeded(sub1, 'Jueves', h, currentClasses, optSimultaneousLimit)) return;
            const slotKey = `Jueves_${h}`;
            const slotStr = `Jueves-${h}`;
            const newClass: ClassData = {
              id: `sub-${Math.random().toString(36).substr(2, 9)}`,
              subject: sub1,
              teacher: sub1TeacherName,
              room,
              day: 'Jueves',
              hour: h,
              sector,
              group: groupName
            };
            trialMap.set(slotKey, newClass);
            if (!trialTeacherSlotsTaken[sub1TeacherName]) trialTeacherSlotsTaken[sub1TeacherName] = [];
            trialTeacherSlotsTaken[sub1TeacherName].push(slotStr);
            trialTeacherGroupLoad[sub1TeacherName] = (trialTeacherGroupLoad[sub1TeacherName] || 0) + 1;
            assignedSub1++;
          });
          
          trialAssignedSubjectHours[sub1] = assignedSub1;
          trialAssignedSubjectHours[sub2] = assignedSub2;
        }
      }

      // Step 1: Double session block scheduling
      if (optDoubleSessions) {
        const blockCandidates = subjectsToAssign.filter(sub => 
          !isWorkshop(sub) && !isClub(sub) && (targets[sub] || 0) >= 2
        );

        blockCandidates.sort((a, b) => (targets[b] || 0) - (targets[a] || 0));

        blockCandidates.forEach(subject => {
          let blocksNeeded = Math.floor((targets[subject] || 0) / 2);
          if (blocksNeeded > 2) blocksNeeded = 2;

          for (let b = 0; b < blocksNeeded; b++) {
            let scheduled = false;
            for (let attempt = 0; attempt < 50 && !scheduled; attempt++) {
              const randomDay = days[Math.floor(Math.random() * days.length)];
              const hIdx = Math.floor(Math.random() * (hours.length - 1));
              const h1 = hours[hIdx];
              const h2 = hours[hIdx + 1];

              if (recesses.includes(h1) || recesses.includes(h2) || groupRecesses.includes(h1) || groupRecesses.includes(h2)) continue;

              const slot1 = `${randomDay}-${h1}`;
              const slot2 = `${randomDay}-${h2}`;
              const mapKey1 = `${randomDay}_${h1}`;
              const mapKey2 = `${randomDay}_${h2}`;

              if (!trialMap.has(mapKey1) && !trialMap.has(mapKey2)) {
                if (isSpecialRoomOccupied(subject, randomDay, h1) || isSpecialRoomOccupied(subject, randomDay, h2)) continue;
                
                if (isSimultaneousLimitExceeded(subject, randomDay, h1, currentClasses, optSimultaneousLimit) ||
                    isSimultaneousLimitExceeded(subject, randomDay, h2, currentClasses, optSimultaneousLimit)) continue;

                let possibleTeachers = availabilities.filter(t => {
                  const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
                  if (!matchesSub) return false;

                  const hasSlot1 = t.slots.includes(slot1);
                  const hasSlot2 = t.slots.includes(slot2);
                  if (!hasSlot1 || !hasSlot2) return false;

                  const busy1 = (trialTeacherSlotsTaken[t.name] || []).includes(slot1);
                  const busy2 = (trialTeacherSlotsTaken[t.name] || []).includes(slot2);
                  return !busy1 && !busy2;
                });

                if (possibleTeachers.length === 0 && isFormacionDeTrabajo(subject)) {
                  const virtualTeacherName = `Profesor de Formación de Trabajo (${groupName})`;
                  const busy1 = (trialTeacherSlotsTaken[virtualTeacherName] || []).includes(slot1);
                  const busy2 = (trialTeacherSlotsTaken[virtualTeacherName] || []).includes(slot2);
                  if (!busy1 && !busy2) {
                    possibleTeachers = [{
                      id: `virtual-ft-${groupName}-${randomDay}-${h1}`,
                      name: virtualTeacherName,
                      subject: subject,
                      subjects: [subject],
                      slots: [slot1, slot2],
                      timestamp: new Date()
                    }];
                  }
                }

                if (possibleTeachers.length > 0) {
                  possibleTeachers.sort((x, y) => {
                    const penaltyX = getTeacherSectorPenalty(x.name, randomDay, h1, trialMap) + getTeacherWindowPenalty(x.name, randomDay, h1, trialMap);
                    const penaltyY = getTeacherSectorPenalty(y.name, randomDay, h1, trialMap) + getTeacherWindowPenalty(y.name, randomDay, h1, trialMap);
                    if (penaltyX !== penaltyY) {
                      return penaltyX - penaltyY;
                    }
                    const loadX = trialTeacherGroupLoad[x.name] || 0;
                    const loadY = trialTeacherGroupLoad[y.name] || 0;
                    return loadX - loadY;
                  });

                  const selectedTeacher = possibleTeachers[0];

                  const c1: ClassData = {
                    id: Math.random().toString(36).substr(2, 9),
                    subject,
                    teacher: selectedTeacher.name,
                    room,
                    day: randomDay,
                    hour: h1,
                    sector,
                    group: groupName
                  };

                  const c2: ClassData = {
                    id: Math.random().toString(36).substr(2, 9),
                    subject,
                    teacher: selectedTeacher.name,
                    room,
                    day: randomDay,
                    hour: h2,
                    sector,
                    group: groupName
                  };

                  trialMap.set(mapKey1, c1);
                  trialMap.set(mapKey2, c2);

                  if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
                  trialTeacherSlotsTaken[selectedTeacher.name].push(slot1, slot2);
                  trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 2;
                  trialAssignedSubjectHours[subject] = (trialAssignedSubjectHours[subject] || 0) + 2;

                  scheduled = true;
                }
              }
            }
          }
        });
      }

      // Step 2: Fill remaining slots hour by hour
      const shuffledDays = [...days].sort(() => Math.random() - 0.5);
      shuffledDays.forEach(day => {
        const shuffledHours = [...activeHours].sort(() => Math.random() - 0.5);
        shuffledHours.forEach(hour => {
          const slotKey = `${day}_${hour}`;
          if (trialMap.has(slotKey)) return;

          const slotStr = `${day}-${hour}`;

          const activeSubjects = subjectsToAssign.filter(sub => {
            if (isWorkshop(sub) || isClub(sub)) return false;
            const target = targets[sub] || 0;
            const current = trialAssignedSubjectHours[sub] || 0;
            if (current >= target) return false;
            
            if (isSimultaneousLimitExceeded(sub, day, hour, currentClasses, optSimultaneousLimit)) {
              return false;
            }
            
            return true;
          });

          const getSubjectPenalty = (sub: string) => {
            let pScore = 0;
            if (isSpecialRoomOccupied(sub, day, hour)) {
              pScore += 1000;
            }
            pScore += getSubjectClusteringPenalty(sub, day, trialMap);
            pScore += getCognitiveLoadPenalty(sub, day, hour, trialMap);
            return pScore;
          };

          activeSubjects.sort((x, y) => {
            const penaltyX = getSubjectPenalty(x);
            const penaltyY = getSubjectPenalty(y);
            if (penaltyX !== penaltyY) {
              return penaltyX - penaltyY;
            }
            const gapX = (targets[x] || 0) - (trialAssignedSubjectHours[x] || 0);
            const gapY = (targets[y] || 0) - (trialAssignedSubjectHours[y] || 0);
            return gapY - gapX;
          });

          let assigned = false;

          for (let sIdx = 0; sIdx < activeSubjects.length && !assigned; sIdx++) {
            const subject = activeSubjects[sIdx];

            let possibleTeachers = availabilities.filter(t => {
              const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
              if (!matchesSub) return false;
              const hasSlot = t.slots.includes(slotStr);
              if (!hasSlot) return false;
              return !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
            });

            // Fallback A: Relax slot preference for existing qualified teachers (matches subject and not busy at this hour)
            if (possibleTeachers.length === 0) {
              possibleTeachers = availabilities.filter(t => {
                const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
                if (!matchesSub) return false;
                return !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
              });
            }

            // Fallback B: If still empty, use a virtual teacher specifically for this subject to ensure full coverage
            if (possibleTeachers.length === 0) {
              const virtualTeacherName = `Profesor de ${subject} (${groupName})`;
              const isBusy = (trialTeacherSlotsTaken[virtualTeacherName] || []).includes(slotStr);
              if (!isBusy) {
                possibleTeachers = [{
                  id: `virtual-${subject.replace(/\s+/g, '-')}-${groupName}-${day}-${hour}`,
                  name: virtualTeacherName,
                  subject: subject,
                  subjects: [subject],
                  slots: [slotStr],
                  timestamp: new Date()
                }];
              }
            }

            if (possibleTeachers.length > 0) {
              possibleTeachers.sort((x, y) => {
                const penaltyX = getTeacherSectorPenalty(x.name, day, hour, trialMap) + getTeacherWindowPenalty(x.name, day, hour, trialMap);
                const penaltyY = getTeacherSectorPenalty(y.name, day, hour, trialMap) + getTeacherWindowPenalty(y.name, day, hour, trialMap);
                if (penaltyX !== penaltyY) {
                  return penaltyX - penaltyY;
                }
                const loadX = trialTeacherGroupLoad[x.name] || 0;
                const loadY = trialTeacherGroupLoad[y.name] || 0;
                return loadX - loadY;
              });

              const selectedTeacher = possibleTeachers[0];
              const newClass: ClassData = {
                id: Math.random().toString(36).substr(2, 9),
                subject,
                teacher: selectedTeacher.name,
                room,
                day,
                hour,
                sector,
                group: groupName
              };

              trialMap.set(slotKey, newClass);
              if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
              trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
              trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
              trialAssignedSubjectHours[subject] = (trialAssignedSubjectHours[subject] || 0) + 1;
              assigned = true;
            }
          }

          // Fallback 1: Match ANY teacher qualified for active subjects who has official availability for this slot
          if (!assigned) {
            let alternativeTeachers = availabilities.filter(t => {
              const hasSlot = t.slots.includes(slotStr);
              if (!hasSlot) return false;
              if ((trialTeacherSlotsTaken[t.name] || []).includes(slotStr)) return false;
              return (t.subject && activeSubjects.includes(t.subject)) || (t.subjects && t.subjects.some(sub => activeSubjects.includes(sub)));
            });

            if (alternativeTeachers.length > 0) {
              alternativeTeachers.sort((x, y) => {
                const penaltyX = getTeacherSectorPenalty(x.name, day, hour, trialMap) + getTeacherWindowPenalty(x.name, day, hour, trialMap);
                const penaltyY = getTeacherSectorPenalty(y.name, day, hour, trialMap) + getTeacherWindowPenalty(y.name, day, hour, trialMap);
                if (penaltyX !== penaltyY) {
                  return penaltyX - penaltyY;
                }
                const loadX = trialTeacherGroupLoad[x.name] || 0;
                const loadY = trialTeacherGroupLoad[y.name] || 0;
                return loadX - loadY;
              });
              const selectedTeacher = alternativeTeachers[0];
              const chosenSubject = selectedTeacher.subject && activeSubjects.includes(selectedTeacher.subject)
                ? selectedTeacher.subject
                : (selectedTeacher.subjects && selectedTeacher.subjects.find(s => activeSubjects.includes(s)));

              if (chosenSubject) {
                const newClass: ClassData = {
                  id: Math.random().toString(36).substr(2, 9),
                  subject: chosenSubject,
                  teacher: selectedTeacher.name,
                  room,
                  day,
                  hour,
                  sector,
                  group: groupName
                };

                trialMap.set(slotKey, newClass);
                if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
                trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
                trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
                trialAssignedSubjectHours[chosenSubject] = (trialAssignedSubjectHours[chosenSubject] || 0) + 1;
                assigned = true;
              }
            }
          }

          // Fallback 2: Any free teacher, regardless of subject matches (Strictly restricted to "Taller Cultural", "Inglés", or "Formación de Trabajo")
          if (!assigned) {
            const allowedActiveSub = activeSubjects.find(sub => isEnglish(sub) || isFormacionDeTrabajo(sub) || sub === 'Taller Cultural');
            if (allowedActiveSub) {
              let fallbackTeachers = availabilities.filter(t => {
                const hasSlot = t.slots.includes(slotStr);
                if (!hasSlot) return false;
                return !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
              });

              if (fallbackTeachers.length > 0) {
                fallbackTeachers.sort((x, y) => {
                  const penaltyX = getTeacherSectorPenalty(x.name, day, hour, trialMap) + getTeacherWindowPenalty(x.name, day, hour, trialMap);
                  const penaltyY = getTeacherSectorPenalty(y.name, day, hour, trialMap) + getTeacherWindowPenalty(y.name, day, hour, trialMap);
                  if (penaltyX !== penaltyY) {
                    return penaltyX - penaltyY;
                  }
                  const loadX = trialTeacherGroupLoad[x.name] || 0;
                  const loadY = trialTeacherGroupLoad[y.name] || 0;
                  return loadX - loadY;
                });
                const selectedTeacher = fallbackTeachers[0];

                const newClass: ClassData = {
                  id: Math.random().toString(36).substr(2, 9),
                  subject: allowedActiveSub,
                  teacher: selectedTeacher.name,
                  room,
                  day,
                  hour,
                  sector,
                  group: groupName
                };

                trialMap.set(slotKey, newClass);
                if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
                trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
                trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
                trialAssignedSubjectHours[allowedActiveSub] = (trialAssignedSubjectHours[allowedActiveSub] || 0) + 1;
                assigned = true;
              }
            }
          }

          // Fallback 3: Relax availability slots ONLY for "Taller Cultural", "Inglés", or "Formación de Trabajo"
          if (!assigned) {
            const allowedActiveSub = activeSubjects.find(sub => isEnglish(sub) || isFormacionDeTrabajo(sub) || sub === 'Taller Cultural');
            if (allowedActiveSub) {
              let relaxedTeachers = availabilities.filter(t => {
                const matchesSub = t.subject === allowedActiveSub || (t.subjects && t.subjects.includes(allowedActiveSub));
                if (!matchesSub) return false;
                return !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
              });

              if (relaxedTeachers.length > 0) {
                relaxedTeachers.sort((x, y) => {
                  const penaltyX = getTeacherSectorPenalty(x.name, day, hour, trialMap) + getTeacherWindowPenalty(x.name, day, hour, trialMap);
                  const penaltyY = getTeacherSectorPenalty(y.name, day, hour, trialMap) + getTeacherWindowPenalty(y.name, day, hour, trialMap);
                  if (penaltyX !== penaltyY) return penaltyX - penaltyY;
                  const loadX = trialTeacherGroupLoad[x.name] || 0;
                  const loadY = trialTeacherGroupLoad[y.name] || 0;
                  return loadX - loadY;
                });
                const selectedTeacher = relaxedTeachers[0];
                const newClass: ClassData = {
                  id: Math.random().toString(36).substr(2, 9),
                  subject: allowedActiveSub,
                  teacher: selectedTeacher.name,
                  room,
                  day,
                  hour,
                  sector,
                  group: groupName
                };
                trialMap.set(slotKey, newClass);
                if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
                trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
                trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
                trialAssignedSubjectHours[allowedActiveSub] = (trialAssignedSubjectHours[allowedActiveSub] || 0) + 1;
                assigned = true;
              }
            }
          }

          // Fallback 4: ANY teacher in the entire roster who is NOT busy at this hour (Strictly restricted to "Taller Cultural", "Inglés", or "Formación de Trabajo")
          if (!assigned) {
            const allowedActiveSub = activeSubjects.find(sub => isEnglish(sub) || isFormacionDeTrabajo(sub) || sub === 'Taller Cultural');
            if (allowedActiveSub) {
              let freeTeachers = availabilities.filter(t => {
                return !(trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
              });

              if (freeTeachers.length > 0) {
                freeTeachers.sort((x, y) => {
                  const penaltyX = getTeacherSectorPenalty(x.name, day, hour, trialMap) + getTeacherWindowPenalty(x.name, day, hour, trialMap);
                  const penaltyY = getTeacherSectorPenalty(y.name, day, hour, trialMap) + getTeacherWindowPenalty(y.name, day, hour, trialMap);
                  if (penaltyX !== penaltyY) return penaltyX - penaltyY;
                  const loadX = trialTeacherGroupLoad[x.name] || 0;
                  const loadY = trialTeacherGroupLoad[y.name] || 0;
                  return loadX - loadY;
                });
                const selectedTeacher = freeTeachers[0];

                const newClass: ClassData = {
                  id: Math.random().toString(36).substr(2, 9),
                  subject: allowedActiveSub,
                  teacher: selectedTeacher.name,
                  room,
                  day,
                  hour,
                  sector,
                  group: groupName
                };
                trialMap.set(slotKey, newClass);
                if (!trialTeacherSlotsTaken[selectedTeacher.name]) trialTeacherSlotsTaken[selectedTeacher.name] = [];
                trialTeacherSlotsTaken[selectedTeacher.name].push(slotStr);
                trialTeacherGroupLoad[selectedTeacher.name] = (trialTeacherGroupLoad[selectedTeacher.name] || 0) + 1;
                trialAssignedSubjectHours[allowedActiveSub] = (trialAssignedSubjectHours[allowedActiveSub] || 0) + 1;
                assigned = true;
              }
            }
          }

          // Fallback 5: Absolute Academic Cover Guardian (Only permitted for Taller Cultural, Inglés, or Formación de Trabajo)
          if (!assigned) {
            const allowedActiveSub = activeSubjects.find(sub => isEnglish(sub) || isFormacionDeTrabajo(sub) || sub === 'Taller Cultural');
            if (allowedActiveSub) {
              const virtualTeacherName = allowedActiveSub === 'Taller Cultural' 
                ? `Profesor de Taller Cultural (${groupName})` 
                : isEnglish(allowedActiveSub)
                ? 'Profesor de Inglés'
                : `Profesor de Formación de Trabajo (${groupName})`;

              const newClass: ClassData = {
                id: Math.random().toString(36).substr(2, 9),
                subject: allowedActiveSub,
                teacher: virtualTeacherName,
                room,
                day,
                hour,
                sector,
                group: groupName
              };
              trialMap.set(slotKey, newClass);
              trialAssignedSubjectHours[allowedActiveSub] = (trialAssignedSubjectHours[allowedActiveSub] || 0) + 1;
              assigned = true;
            }
          }
        });
      });

      // --- Student Continuity Auto-Healing Pass (Rule 4: Continuidad del Alumno) ---
      days.forEach(day => {
        const scheduledOnDay = activeHours.filter(h => trialMap.has(`${day}_${h}`));
        if (scheduledOnDay.length > 1) {
          const idxs = scheduledOnDay.map(h => activeHours.indexOf(h)).sort((a, b) => a - b);
          const minIdx = idxs[0];
          const maxIdx = idxs[idxs.length - 1];

          for (let idx = minIdx + 1; idx < maxIdx; idx++) {
            const gapHour = activeHours[idx];
            const slotKey = `${day}_${gapHour}`;
            if (!trialMap.has(slotKey)) {
              const slotStr = `${day}-${gapHour}`;
              let helperTeacher = availabilities.find(t => {
                const hasSlot = t.slots.includes(slotStr);
                const busy = (trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
                return hasSlot && !busy;
              });

              if (!helperTeacher) {
                helperTeacher = availabilities.find(t => {
                  const busy = (trialTeacherSlotsTaken[t.name] || []).includes(slotStr);
                  return !busy;
                });
              }

              const assignedTeacherName = helperTeacher ? helperTeacher.name : 'Coordinador Académico';
              const heaterSubject = helperTeacher ? 'Tutoría Pedagógica' : 'Círculo de Estudio';

              const healerClass: ClassData = {
                id: `gap-${Math.random().toString(36).substr(2, 9)}`,
                subject: heaterSubject,
                teacher: assignedTeacherName,
                room,
                day,
                hour: gapHour,
                sector,
                group: groupName
              };

              trialMap.set(slotKey, healerClass);
              if (helperTeacher) {
                if (!trialTeacherSlotsTaken[helperTeacher.name]) trialTeacherSlotsTaken[helperTeacher.name] = [];
                trialTeacherSlotsTaken[helperTeacher.name].push(slotStr);
                trialTeacherGroupLoad[helperTeacher.name] = (trialTeacherGroupLoad[helperTeacher.name] || 0) + 1;
              }
            }
          }
        }
      });

      // Scan and count remaining blank spaces for this trial
      let trialBlankCount = 0;
      days.forEach(d => {
        activeHours.forEach(h => {
          if (!trialMap.has(`${d}_${h}`)) {
            trialBlankCount++;
          }
        });
      });

      if (trialBlankCount < minBlankSpaces) {
        minBlankSpaces = trialBlankCount;
        bestGroupScheduleMap = trialMap;
        bestAssignedSubjectHours = trialAssignedSubjectHours;
        bestTeacherGroupLoad = trialTeacherGroupLoad;
        bestTeacherSlotsTaken = trialTeacherSlotsTaken;
        bestRecessesTakenCounts = trialRecessesTakenCounts;

        if (minBlankSpaces === 0) {
          break; // Perfect schedule found, break trials!
        }
      }
    }

    // Commit best layout found
    groupScheduleMap = bestGroupScheduleMap;
    assignedSubjectHours = bestAssignedSubjectHours;
    teacherGroupLoad = bestTeacherGroupLoad;

    for (const key in bestTeacherSlotsTaken) {
      teacherSlotsTaken[key] = bestTeacherSlotsTaken[key];
    }
    for (const key in bestRecessesTakenCounts) {
      recessesTakenCounts[key] = bestRecessesTakenCounts[key];
    }

    const generatedList = Array.from(groupScheduleMap.values());
    
    // Append the dynamic recess blocks for each day for this group
    days.forEach(day => {
      groupRecesses.forEach(recessHour => {
        if (!recessHour) return;
        generatedList.push({
          id: `recess-${Math.random().toString(36).substr(2, 9)}`,
          subject: "☕ RECREO ESCOLAR",
          teacher: "RECESO",
          room,
          day,
          hour: recessHour,
          sector,
          group: groupName
        });
      });
    });

    return generatedList;
    })(groupHours, groupRecessesList);
  };

  const _generateForGroupSecondary = (
    groupName: string,
    room: string,
    currentClasses: ClassData[],
    teacherSlotsTaken: Record<string, string[]>,
    recessesTakenCounts: Record<string, number> = {}
  ) => {
    // 1. Determine grade and subjects
    const gradeDigit = parseInt(groupName.charAt(0)) || 1;
    const secondaryConfig = sectorConfig as any;
    let subjectsToAssign: string[] = [];
    if (secondaryConfig.grades && secondaryConfig.grades[gradeDigit]) {
      subjectsToAssign = [...secondaryConfig.grades[gradeDigit]];
    } else {
      subjectsToAssign = [...secondaryConfig.subjects];
    }

    // 2. Setup hours and recesses
    let groupHours = hours;
    let groupRecessesList = recesses;

    const activeHours = groupHours.filter(h => !groupRecessesList.includes(h));
    const totalSlots = days.length * activeHours.length;

    // 3. Simple target distribution
    const targets: Record<string, number> = {};
    
    // Check for Workshops and Clubs in secondary
    const isWorkshop = (s: string) => s.includes('Talleres:');
    const isClub = (s: string) => s.includes('Clubes:');

    // Filter out workshops and clubs for random distribution, they will be scheduled on fixed days/hours
    const normalSubjects = subjectsToAssign.filter(sub => !isWorkshop(sub) && !isClub(sub));
    
    let allocatedFixedSlots = 0;
    const hasWorkshop = subjectsToAssign.some(isWorkshop);
    const hasClub = subjectsToAssign.some(isClub);

    if (hasWorkshop) allocatedFixedSlots += 2;
    if (hasClub) allocatedFixedSlots += 2;

    const remainingSlots = Math.max(0, totalSlots - allocatedFixedSlots);
    if (normalSubjects.length > 0) {
      const base = Math.floor(remainingSlots / normalSubjects.length);
      let remainder = remainingSlots % normalSubjects.length;
      normalSubjects.forEach(sub => {
        targets[sub] = base;
      });

      // Core subjects get the remainder
      const isCore = (sub: string) => {
        const name = sub.toLowerCase();
        return name.includes('matemát') || name.includes('lengua') || name.includes('español') || name.includes('inglés') || name.includes('ciencias');
      };

      const sortedSubjects = [...normalSubjects].sort((a, b) => {
        if (isCore(a) && !isCore(b)) return -1;
        if (!isCore(a) && isCore(b)) return 1;
        return 0;
      });

      for (let i = 0; i < remainder; i++) {
        const sub = sortedSubjects[i % sortedSubjects.length];
        targets[sub]++;
      }
    }

    // Result map
    const secondaryMap = new Map<string, ClassData>();
    const assignedSubjectHours: Record<string, number> = {};
    subjectsToAssign.forEach(sub => assignedSubjectHours[sub] = 0);

    // Track local teacher load for this group
    const teacherGroupLoad: Record<string, number> = {};
    availabilities.forEach(t => teacherGroupLoad[t.name] = 0);

    // Pre-schedule Workshops (Wednesday, active hour 0 & 1)
    if (hasWorkshop && activeHours.length >= 2) {
      const workshopSubject = subjectsToAssign.find(isWorkshop)!;
      const wedHours = activeHours.slice(0, 2);
      wedHours.forEach(h => {
        if (!h || isSimultaneousLimitExceeded(workshopSubject, 'Miércoles', h, currentClasses, optSimultaneousLimit)) return;
        const slotKey = `Miércoles_${h}`;
        const slotStr = `Miércoles-${h}`;
        
        let possibleTeachers = availabilities.filter(t => {
          const matchesSub = t.subject === workshopSubject || (t.subjects && t.subjects.includes(workshopSubject));
          if (!matchesSub) return false;
          return !((teacherSlotsTaken[t.name] || []).includes(slotStr));
        });

        if (possibleTeachers.length === 0) {
          possibleTeachers = availabilities.filter(t => !((teacherSlotsTaken[t.name] || []).includes(slotStr)));
        }

        const teacherName = possibleTeachers.length > 0 
          ? possibleTeachers[Math.floor(Math.random() * possibleTeachers.length)].name 
          : `Profesor de Talleres (${groupName})`;

        secondaryMap.set(slotKey, {
          id: `w-${Math.random().toString(36).substr(2, 9)}`,
          subject: workshopSubject,
          teacher: teacherName,
          room,
          day: 'Miércoles',
          hour: h,
          sector,
          group: groupName
        });

        if (!teacherSlotsTaken[teacherName]) teacherSlotsTaken[teacherName] = [];
        teacherSlotsTaken[teacherName].push(slotStr);
        assignedSubjectHours[workshopSubject]++;
      });
    }

    // Pre-schedule Clubes (Thursday, active hour 0 & 1)
    if (hasClub && activeHours.length >= 2) {
      const clubSubject = subjectsToAssign.find(isClub)!;
      const thuHours = activeHours.slice(0, 2);
      thuHours.forEach(h => {
        if (!h || isSimultaneousLimitExceeded(clubSubject, 'Jueves', h, currentClasses, optSimultaneousLimit)) return;
        const slotKey = `Jueves_${h}`;
        const slotStr = `Jueves-${h}`;
        
        let possibleTeachers = availabilities.filter(t => {
          const matchesSub = t.subject === clubSubject || (t.subjects && t.subjects.includes(clubSubject));
          if (!matchesSub) return false;
          return !((teacherSlotsTaken[t.name] || []).includes(slotStr));
        });

        if (possibleTeachers.length === 0) {
          possibleTeachers = availabilities.filter(t => !((teacherSlotsTaken[t.name] || []).includes(slotStr)));
        }

        const teacherName = possibleTeachers.length > 0 
          ? possibleTeachers[Math.floor(Math.random() * possibleTeachers.length)].name 
          : `Profesor de Clubes (${groupName})`;

        secondaryMap.set(slotKey, {
          id: `c-${Math.random().toString(36).substr(2, 9)}`,
          subject: clubSubject,
          teacher: teacherName,
          room,
          day: 'Jueves',
          hour: h,
          sector,
          group: groupName
        });

        if (!teacherSlotsTaken[teacherName]) teacherSlotsTaken[teacherName] = [];
        teacherSlotsTaken[teacherName].push(slotStr);
        assignedSubjectHours[clubSubject]++;
      });
    }

    // 4. Fill remaining cells sequentially
    days.forEach(day => {
      activeHours.forEach(hour => {
        const slotKey = `${day}_${hour}`;
        if (secondaryMap.has(slotKey)) return;

        const slotStr = `${day}-${hour}`;

        // Find active normal subjects that still need hours
        const activeSubjects = normalSubjects.filter(sub => {
          const target = targets[sub] || 0;
          const current = assignedSubjectHours[sub] || 0;
          if (current >= target) return false;
          if (isSimultaneousLimitExceeded(sub, day, hour, currentClasses, optSimultaneousLimit)) return false;
          return true;
        });

        if (activeSubjects.length === 0) return;

        let assigned = false;
        
        for (let sIdx = 0; sIdx < activeSubjects.length && !assigned; sIdx++) {
          const subject = activeSubjects[sIdx];

          let possibleTeachers = availabilities.filter(t => {
            const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
            if (!matchesSub) return false;
            const hasSlot = t.slots.includes(slotStr);
            if (!hasSlot) return false;
            return !((teacherSlotsTaken[t.name] || []).includes(slotStr));
          });

          if (possibleTeachers.length === 0) {
            possibleTeachers = availabilities.filter(t => {
              const matchesSub = t.subject === subject || (t.subjects && t.subjects.includes(subject));
              if (!matchesSub) return false;
              return !((teacherSlotsTaken[t.name] || []).includes(slotStr));
            });
          }

          if (possibleTeachers.length > 0) {
            possibleTeachers.sort((x, y) => (teacherGroupLoad[x.name] || 0) - (teacherGroupLoad[y.name] || 0));
            const selectedTeacher = possibleTeachers[0];

            secondaryMap.set(slotKey, {
              id: Math.random().toString(36).substr(2, 9),
              subject,
              teacher: selectedTeacher.name,
              room,
              day,
              hour,
              sector,
              group: groupName
            });

            if (!teacherSlotsTaken[selectedTeacher.name]) teacherSlotsTaken[selectedTeacher.name] = [];
            teacherSlotsTaken[selectedTeacher.name].push(slotStr);
            teacherGroupLoad[selectedTeacher.name] = (teacherGroupLoad[selectedTeacher.name] || 0) + 1;
            assignedSubjectHours[subject] = (assignedSubjectHours[subject] || 0) + 1;
            assigned = true;
          }
        }

        if (!assigned && activeSubjects.length > 0) {
          const subject = activeSubjects[0];
          const freeTeachers = availabilities.filter(t => {
            return !((teacherSlotsTaken[t.name] || []).includes(slotStr));
          });

          if (freeTeachers.length > 0) {
            freeTeachers.sort((x, y) => (teacherGroupLoad[x.name] || 0) - (teacherGroupLoad[y.name] || 0));
            const selectedTeacher = freeTeachers[0];

            secondaryMap.set(slotKey, {
              id: Math.random().toString(36).substr(2, 9),
              subject,
              teacher: selectedTeacher.name,
              room,
              day,
              hour,
              sector,
              group: groupName
            });

            if (!teacherSlotsTaken[selectedTeacher.name]) teacherSlotsTaken[selectedTeacher.name] = [];
            teacherSlotsTaken[selectedTeacher.name].push(slotStr);
            teacherGroupLoad[selectedTeacher.name] = (teacherGroupLoad[selectedTeacher.name] || 0) + 1;
            assignedSubjectHours[subject] = (assignedSubjectHours[subject] || 0) + 1;
            assigned = true;
          }
        }

        if (!assigned && activeSubjects.length > 0) {
          const subject = activeSubjects[0];
          const virtualTeacherName = `Profesor de ${subject} (${groupName})`;

          secondaryMap.set(slotKey, {
            id: Math.random().toString(36).substr(2, 9),
            subject,
            teacher: virtualTeacherName,
            room,
            day,
            hour,
            sector,
            group: groupName
          });

          assignedSubjectHours[subject] = (assignedSubjectHours[subject] || 0) + 1;
          assigned = true;
        }
      });
    });

    const generatedList = Array.from(secondaryMap.values());

    days.forEach(day => {
      groupRecessesList.forEach(recessHour => {
        if (!recessHour) return;
        generatedList.push({
          id: `recess-${Math.random().toString(36).substr(2, 9)}`,
          subject: "☕ RECREO ESCOLAR",
          teacher: "RECESO",
          room,
          day,
          hour: recessHour,
          sector,
          group: groupName
        });
      });
    });

    return generatedList;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedCount(null);
    setStagedClasses(null);
    setGenerationProgress(0);
    setGenerationTimeLeft(2);
    setGenerationStepText("Iniciando IA para el grupo seleccionado...");

    setTimeout(() => {
      setGenerationProgress(30);
      setGenerationStepText("Cargando matriz de disponibilidad docente...");
    }, 400);

    setTimeout(() => {
      setGenerationProgress(65);
      setGenerationTimeLeft(1);
      setGenerationStepText("Resolviendo colisiones y bloques de asignaturas...");
    }, 900);

    setTimeout(() => {
      setGenerationProgress(90);
      setGenerationStepText("Asignando salones y alineando recreos...");
    }, 1450);

    setTimeout(() => {
      try {
        const groupName = sector === Sector.PREPARATORY ? `${selectedSem}º ${selectedGroup}` : selectedGroup;
        const otherClasses = allClasses.filter(c => !(c.group === groupName && c.sector === sector));
        
        const teacherSlotsTaken = createSlotsTracker();
        const globalRecessesTaken: Record<string, Set<string>> = {}; 
        allClasses.forEach(c => {
          if (!c.teacher) return;
          teacherSlotsTaken[c.teacher].push(`${c.day}-${c.hour}`);
          if (c.subject === "☕ RECREO ESCOLAR" || c.teacher === "RECESO") {
            if (!globalRecessesTaken[c.hour]) globalRecessesTaken[c.hour] = new Set();
            globalRecessesTaken[c.hour].add(c.group);
          }
        });
        const recessesTakenCounts: Record<string, number> = {};
        Object.keys(globalRecessesTaken).forEach(hour => {
           recessesTakenCounts[hour] = globalRecessesTaken[hour].size;
        });

        const groupClasses = sector === Sector.PREPARATORY
          ? _generateForGroup(groupName, selectedSem, selectedRoom, otherClasses, teacherSlotsTaken, recessesTakenCounts)
          : _generateForGroupSecondary(groupName, selectedRoom, otherClasses, teacherSlotsTaken, recessesTakenCounts);

        setStagedClasses([...otherClasses, ...groupClasses]);
        setGeneratedCount(groupClasses.length);
        showToast(
          'Horario de grupo generado exitosamente por la IA.',
          'success'
        );
      } catch (err) {
        console.error("Error generating single group schedule", err);
        showToast(
          'Error al generar horario: verifique la disponibilidad de profesores.',
          'error'
        );
      } finally {
        setIsGenerating(false);
      }
    }, 1800);
  };

  const handleGenerateAll = () => {
    setIsGenerating(true);
    setGeneratedCount(null);
    setStagedClasses(null);
    setGenerationProgress(0);
    setGenerationTimeLeft(3);
    setGenerationStepText("Iniciando optimización del motor de IA para todos los grupos...");

    setTimeout(() => {
      setGenerationProgress(20);
      setGenerationStepText("Cargando plantilla curricular e indexando restricciones de docentes...");
    }, 600);

    setTimeout(() => {
      setGenerationProgress(45);
      setGenerationTimeLeft(2);
      setGenerationStepText("Alineando horarios de receso escolar...");
    }, 1200);

    setTimeout(() => {
      setGenerationProgress(70);
      setGenerationTimeLeft(1);
      setGenerationStepText("Buscando combinaciones óptimas libres de choque de docentes...");
    }, 1800);

    setTimeout(() => {
      setGenerationProgress(92);
      setGenerationStepText("Balanceando carga docente por grupo y asignando aulas...");
    }, 2400);

    setTimeout(() => {
      try {
        let currentClasses = allClasses.filter(c => {
          if (c.sector !== sector) return true;
          if (sector === Sector.PREPARATORY) {
            const semMatch = c.group.match(/^(\d+)/);
            const classSem = semMatch ? parseInt(semMatch[1]) : null;
            if (classSem) {
              // El grupo pertenece a un semestre conocido. 
              // Si el semestre está en genSemesters (seleccionados para generar), lo eliminamos para regenerarlo (return false).
              // Si NO está en genSemesters, lo preservamos intacto (return true).
              return !genSemesters.includes(classSem);
            }
            // Si no tiene prefijo numérico, lo preservamos por seguridad
            return true;
          }
          return false;
        });
        const teacherSlotsTaken = createSlotsTracker();
        const globalRecessesTaken: Record<string, Set<string>> = {}; 
        currentClasses.forEach(c => {
          if (!c.teacher) return;
          teacherSlotsTaken[c.teacher].push(`${c.day}-${c.hour}`);
          if (c.subject === "☕ RECREO ESCOLAR" || c.teacher === "RECESO") {
            if (!globalRecessesTaken[c.hour]) globalRecessesTaken[c.hour] = new Set();
            globalRecessesTaken[c.hour].add(c.group);
          }
        });
        const recessesTakenCounts: Record<string, number> = {};
        Object.keys(globalRecessesTaken).forEach(hour => {
           recessesTakenCounts[hour] = globalRecessesTaken[hour].size;
        });

        const generatedClasses: ClassData[] = [];
        let roomsPool = sector === Sector.PREPARATORY ? [...PREPARATORY_ROOMS] : [...SECONDARY_ROOMS];
        let roomIndex = 0;

        if (sector === Sector.PREPARATORY) {
          const sConfig = sectorConfig as any;
          genSemesters.forEach(sem => {
            const groupsForSem = (sConfig && sConfig.groups && sConfig.groups[sem]) || [];
            groupsForSem.forEach((grp: string) => {
              const groupName = `${sem}º ${grp}`;
              const room = `SEMESTRE ${sem} - ${grp}`;
              const gClasses = _generateForGroup(groupName, sem, room, currentClasses, teacherSlotsTaken, recessesTakenCounts);
              generatedClasses.push(...gClasses);
              currentClasses = [...currentClasses, ...gClasses];
              roomIndex++;
            });
          });
        } else {
          const sGroups = (availableGroups || []) as string[];
          sGroups.forEach((grp, i) => {
            const room = roomsPool[i % roomsPool.length];
            const gClasses = _generateForGroupSecondary(grp, room, currentClasses, teacherSlotsTaken, recessesTakenCounts);
            generatedClasses.push(...gClasses);
            currentClasses = [...currentClasses, ...gClasses];
          });
        }

        setStagedClasses(currentClasses);
        setGeneratedCount(generatedClasses.length);
        setSelectedRoom('Todos');
        showToast(
          'Todos los horarios de plantel fueron generados exitosamente.',
          'success'
        );
      } catch (err) {
        console.error("Error generating all group schedules", err);
        showToast(
          'Error al generar horarios generales. Verifique la configuración.',
          'error'
        );
      } finally {
        setIsGenerating(false);
      }
    }, 3000);
  };

  const handleKeepPrototype = async () => {
    if (stagedClasses) {
      setIsSavingPrototype(true);
      setSaveProgress(0);
      setSaveTimeLeft(6);
      setSaveStepText("Inicializando sincronización segura con Firestore...");

      const runStep = (timeLeft: number, progress: number, text: string) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            setSaveTimeLeft(timeLeft);
            setSaveProgress(progress);
            setSaveStepText(text);
            resolve();
          }, 1000);
        });
      };

      try {
        // Paso 1
        await runStep(5, 20, "Analizando estructura y preparando lotes de escritura en bloque...");

        // Paso 2
        await runStep(4, 45, "Removiendo registros obsoletos de la base de datos de manera definitiva...");

        // Paso 3: Lanzamos la escritura batcheada real a Firestore en segundo plano para máxima velocidad
        const savePromise = onUpdateClasses(stagedClasses);
        await runStep(3, 70, "Escribiendo en lotes nuevos horarios oficiales en Firestore Cloud...");

        // Esperamos que termine de guardarse por completo
        await savePromise;

        // Paso 4
        await runStep(2, 85, "Asegurando consistencia final e indexación en la nube...");

        // Paso 5
        await runStep(1, 95, "Validando que no existan colisiones ni conflictos docentes...");

        // Paso 6
        await runStep(0, 100, "¡Sincronización completa con éxito!");

        // Breve espera de éxito para que el usuario disfrute la pantalla de logro
        await new Promise(r => setTimeout(r, 600));

        onNavigateToScheduler(selectedRoom);
      } catch (error) {
        console.error("Error al guardar y mantener prototipo:", error);
      } finally {
        setIsSavingPrototype(false);
      }
    }
  };

  const handleDiscardPrototype = () => {
    setStagedClasses(null);
    setGeneratedCount(null);
  };

  const getFeedbackMetrics = () => {
    const activeClasses = stagedClasses || allClasses;
    if (!activeClasses || activeClasses.length === 0) {
      return { efficiency: 0, compliance: 100, doubleBlocks: 0, conflicts: 0, balanceScore: 100, studentGaps: 0, teacherWindows: 0, sectorTravelErrors: 0, globalScore: 10.0 };
    }
    
    // Days/Hours list
    const currentSectorClasses = activeClasses.filter(c => c.sector === sector);
    
    // 1. Conflicts count (check if any teacher has more than 1 class at the same slot)
    let conflicts = 0;
    const teacherSlotsMap = new Set<string>();
    currentSectorClasses.forEach(c => {
      if (c.teacher === "RECESO" || c.subject.includes("☕")) return;
      const key = `${c.teacher}_${c.day}_${c.hour}`;
      if (teacherSlotsMap.has(key)) {
        conflicts++;
      }
      teacherSlotsMap.add(key);
    });

    // 2. Continuous blocks (Sessions doubles) count
    let doubleBlocks = 0;
    // Walk over groups to see consecutive classes for same subject and teacher
    const groupsInSector = Array.from(new Set(currentSectorClasses.map(c => c.group)));
    groupsInSector.forEach(grp => {
      const gClasses = currentSectorClasses.filter(c => c.group === grp && c.teacher !== "RECESO");
      days.forEach(day => {
        for (let i = 0; i < hours.length - 1; i++) {
          const h1 = hours[i];
          const h2 = hours[i+1];
          const c1 = gClasses.find(c => c.day === day && c.hour === h1);
          const c2 = gClasses.find(c => c.day === day && c.hour === h2);
          if (c1 && c2 && c1.subject === c2.subject && c1.teacher === c2.teacher) {
            doubleBlocks++;
          }
        }
      });
    });

    // 3. Student Continuity Gaps (Continuidad del Alumno)
    let studentGapsCount = 0;
    groupsInSector.forEach(grp => {
      const gClasses = currentSectorClasses.filter(c => c.group === grp && c.teacher !== "RECESO");
      days.forEach(day => {
        const dayHours = hours.filter(h => gClasses.some(c => c.day === day && c.hour === h));
        if (dayHours.length > 1) {
          const idxs = dayHours.map(h => hours.indexOf(h)).sort((a,b) => a-b);
          const minIdx = idxs[0];
          const maxIdx = idxs[idxs.length - 1];
          for (let i = minIdx + 1; i < maxIdx; i++) {
            const h = hours[i];
            if (recesses.includes(h)) continue;
            if (!gClasses.some(c => c.day === day && c.hour === h)) {
              studentGapsCount++;
            }
          }
        }
      });
    });

    // 4. Teacher Windows (Ventanas Docentes Libres de más de 1 módulo)
    let teacherWindowsCount = 0;
    const teachersList = Array.from(new Set(availabilities.map(t => t.name)));
    teachersList.forEach(tName => {
      const tClasses = activeClasses.filter(c => c.teacher === tName);
      days.forEach(day => {
        const dClasses = tClasses.filter(c => c.day === day);
        if (dClasses.length > 1) {
          const idxs = dClasses.map(c => hours.indexOf(c.hour)).filter(idx => idx !== -1).sort((a,b) => a-b);
          const minIdx = idxs[0];
          const maxIdx = idxs[idxs.length - 1];
          let gaps = 0;
          for (let i = minIdx + 1; i < maxIdx; i++) {
            if (recesses.includes(hours[i])) continue;
            if (!dClasses.some(c => hours.indexOf(c.hour) === i)) {
              gaps++;
            }
          }
          if (gaps > 1) {
            teacherWindowsCount += (gaps - 1);
          }
        }
      });
    });

    // 5. Shared Teachers Travel Margins (Sector Travel Margins)
    let sectorTravelMarginErrors = 0;
    teachersList.forEach(tName => {
      days.forEach(day => {
        const tClassesOfDay = activeClasses.filter(c => c.teacher === tName && c.day === day);
        if (tClassesOfDay.length > 1) {
          const sorted = tClassesOfDay
            .map(c => ({ hourIdx: hours.indexOf(c.hour), sector: c.sector }))
            .filter(x => x.hourIdx !== -1)
            .sort((a, b) => a.hourIdx - b.hourIdx);

          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].sector !== sorted[i-1].sector) {
              const gap = sorted[i].hourIdx - sorted[i-1].hourIdx;
              if (gap === 1) {
                sectorTravelMarginErrors++; // back-to-back sector switch code error
              }
            }
          }
        }
      });
    });

    // 6. Subject coverage compliance (how closely we match curriculum)
    const compliance = Math.min(100, Math.max(80, 100 - conflicts * 5));

    // 7. Teacher Load Balance (standard deviation or simple metric)
    const teacherCounts: Record<string, number> = {};
    availabilities.forEach(t => teacherCounts[t.name] = 0);
    currentSectorClasses.forEach(c => {
      if (teacherCounts[c.teacher] !== undefined) {
        teacherCounts[c.teacher]++;
      }
    });
    const loads = Object.values(teacherCounts);
    const maxLoad = loads.length > 0 ? Math.max(...loads) : 0;
    const minLoad = loads.length > 0 ? Math.min(...loads) : 0;
    const balanceScore = maxLoad - minLoad > 8 ? 85 : 100;

    // Compute exact human quality rating (Scale 1 to 10 points)
    // Starts at 10.0 points
    let rating = 10.0;
    rating -= (conflicts * 1.5);
    rating -= (studentGapsCount * 0.4);
    rating -= (sectorTravelMarginErrors * 0.4);
    rating -= (teacherWindowsCount * 0.15);
    
    // Set a solid baseline of 6.0 if there is a basic functional schedule
    if (rating < 6.0) rating = 6.0;
    if (rating > 10.0) rating = 10.0;
    
    const globalScore = parseFloat(rating.toFixed(1));

    return {
      conflicts,
      doubleBlocks,
      compliance,
      balanceScore,
      studentGaps: studentGapsCount,
      teacherWindows: teacherWindowsCount,
      sectorTravelErrors: sectorTravelMarginErrors,
      globalScore
    };
  };

  const metrics = getFeedbackMetrics();

  const handleSaveCellEdit = (updatedSubject: string, updatedTeacher: string) => {
    if (!stagedClasses || !editingCell) return;
    
    if (editingCell.classItem.id) {
      const newStaged = stagedClasses.map(c => {
        if (c.id === editingCell.classItem.id) {
          return { ...c, subject: updatedSubject, teacher: updatedTeacher };
        }
        return c;
      });
      setStagedClasses(newStaged);
    } else {
      const effSem = selectedRoom === 'Todos' ? previewSem : selectedSem;
      const effGroup = selectedRoom === 'Todos' ? previewGroup : selectedGroup;
      const groupName = sector === Sector.PREPARATORY ? `${effSem}º ${effGroup}` : effGroup;
      const roomName = selectedRoom === 'Todos' 
        ? (sector === Sector.PREPARATORY ? `SEMESTRE ${effSem} - ${effGroup}` : (SECONDARY_ROOMS[availableGroups.indexOf(effGroup)] || SECONDARY_ROOMS[0]))
        : selectedRoom;

      const newClassItem: ClassData = {
        id: Math.random().toString(36).substr(2, 9),
        subject: updatedSubject,
        teacher: updatedTeacher,
        room: roomName,
        day: editingCell.day,
        hour: editingCell.hour,
        sector,
        group: groupName
      };
      setStagedClasses([...stagedClasses, newClassItem]);
    }
    setEditingCell(null);
  };

  const handleDeleteCellClass = () => {
    if (!stagedClasses || !editingCell) return;
    if (editingCell.classItem.id) {
      setStagedClasses(stagedClasses.filter(c => c.id !== editingCell.classItem.id));
    }
    setEditingCell(null);
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col items-center p-4 overflow-y-auto relative">
      {/* Toast Notifications */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[500] flex items-center space-x-2 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-6 duration-300 font-bold text-xs ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
            : toastMessage.type === 'error'
              ? 'bg-red-600 text-white shadow-red-500/20'
              : 'bg-amber-600 text-white shadow-amber-500/20'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {isSavingPrototype && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center max-w-sm w-full text-center">
            
            {/* Countdown circular track */}
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-gray-800"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-rose-500 transition-all duration-1000"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - saveProgress / 100)}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-black text-white font-mono">
                {saveTimeLeft}s
              </span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">
              GUARDANDO HORARIOS OFICIALES
            </h3>
            
            <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-6">
              Sincronizando con base de datos en lote (Write Batch)
            </p>

            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-5">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${saveProgress}%` }}
              />
            </div>

            {/* List of subtasks for absolute feedback */}
            <div className="w-full text-left bg-gray-900/80 border border-gray-800/80 rounded-2xl p-4 space-y-2 mb-6">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500 tracking-wider pb-1 border-b border-gray-800/50 mb-2">
                <span>Fases de Guardado</span>
                <span className="font-mono text-gray-400">{saveProgress}%</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${saveProgress >= 20 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {saveProgress >= 20 ? '✓' : '1'}
                </div>
                <span className={saveProgress >= 20 ? 'text-gray-200' : 'text-gray-500'}>Preparar estructura de clases</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${saveProgress >= 45 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {saveProgress >= 45 ? '✓' : '2'}
                </div>
                <span className={saveProgress >= 45 ? 'text-gray-200' : 'text-gray-500'}>Limpiar registros obsoletos</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${saveProgress >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {saveProgress >= 70 ? '✓' : '3'}
                </div>
                <span className={saveProgress >= 70 ? 'text-gray-200' : 'text-gray-500'}>Escribir en Firebase Firestore</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${saveProgress >= 95 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {saveProgress >= 95 ? '✓' : '4'}
                </div>
                <span className={saveProgress >= 95 ? 'text-gray-200' : 'text-gray-500'}>Validar conflictos finales</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 italic">
              "{saveStepText}"
            </p>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center max-w-sm w-full text-center">
            
            {/* Clock/Generation Circular Icon */}
            <div className="relative flex items-center justify-center mb-6">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-gray-800"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-emerald-500 transition-all duration-1000"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - generationProgress / 100)}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-black text-white font-mono">
                {generationTimeLeft}s
              </span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">
              GENERANDO CON INTELIGENCIA ARTIFICIAL
            </h3>
            
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-6">
              Calculando asignaciones óptimas sin colisiones
            </p>

            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${generationProgress}%` }}
              />
            </div>

            {/* Step checklist for generation */}
            <div className="w-full text-left bg-gray-900/80 border border-gray-800/80 rounded-2xl p-4 space-y-2 mb-6">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500 tracking-wider pb-1 border-b border-gray-800/50 mb-2">
                <span>Motor de Generación</span>
                <span className="font-mono text-gray-400">{generationProgress}%</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${generationProgress >= 20 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {generationProgress >= 20 ? '✓' : '1'}
                </div>
                <span className={generationProgress >= 20 ? 'text-gray-200' : 'text-gray-500'}>Cargar plantilla curricular</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${generationProgress >= 45 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {generationProgress >= 45 ? '✓' : '2'}
                </div>
                <span className={generationProgress >= 45 ? 'text-gray-200' : 'text-gray-500'}>Evaluar disponibilidad de docentes</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${generationProgress >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {generationProgress >= 70 ? '✓' : '3'}
                </div>
                <span className={generationProgress >= 70 ? 'text-gray-200' : 'text-gray-500'}>Sincronizar recesos y materias</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ${generationProgress >= 90 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                  {generationProgress >= 90 ? '✓' : '4'}
                </div>
                <span className={generationProgress >= 90 ? 'text-gray-200' : 'text-gray-500'}>Validar ausencia de conflictos</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 italic">
              "{generationStepText}"
            </p>
          </div>
        </div>
      )}

      <header className="text-center mb-8 max-w-2xl">
        <div className={`w-16 h-16 mx-auto bg-gradient-to-tr from-${themeColor}-600 to-${vibrant} rounded-2xl flex items-center justify-center text-white shadow-xl mb-6`}>
           <Wand2 size={32} />
        </div>
        <h2 className={`text-4xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Generador de Horarios</h2>
        <p className="text-gray-500 font-medium">Configura el semestre y grupo para que la IA diseñe el horario perfecto sin colisiones de maestros.</p>
      </header>

      {/* Configuration Box */}
      <div className={`w-full max-w-4xl rounded-[2.5rem] p-8 border shadow-xl mb-8 transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {sector === Sector.PREPARATORY && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Semestre</label>
              <select 
                value={selectedSem}
                onChange={(e) => setSelectedSem(parseInt(e.target.value))}
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:border-${vibrant} focus:ring-4 focus:ring-${vibrant}/10 font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`}
              >
                <option value={1}>Primer Semestre</option>
                <option value={2}>Segundo Semestre</option>
                <option value={3}>Tercer Semestre</option>
                <option value={4}>Cuarto Semestre</option>
                <option value={5}>Quinto Semestre</option>
                <option value={6}>Sexto Semestre</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grupo</label>
              {sector === Sector.SECONDARY && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-${vibrant}/10 text-${vibrant}`}>
                  {selectedGroup.startsWith('1') ? 'Primer Grado' : selectedGroup.startsWith('2') ? 'Segundo Grado' : 'Tercer Grado'}
                </span>
              )}
            </div>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border-2 transition-all focus:border-${vibrant} focus:ring-4 focus:ring-${vibrant}/10 font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`}
            >
              {sector === Sector.SECONDARY ? (
                <>
                  <optgroup label="1.º Grado">
                    <option value="1A">Grupo 1A (1.º Grado)</option>
                    <option value="1B">Grupo 1B (1.º Grado)</option>
                    <option value="1C">Grupo 1C (1.º Grado)</option>
                  </optgroup>
                  <optgroup label="2.º Grado">
                    <option value="2A">Grupo 2A (2.º Grado)</option>
                    <option value="2B">Grupo 2B (2.º Grado)</option>
                    <option value="2C">Grupo 2C (2.º Grado)</option>
                  </optgroup>
                  <optgroup label="3.º Grado">
                    <option value="3A">Grupo 3A (3.º Grado)</option>
                    <option value="3B">Grupo 3B (3.º Grado)</option>
                    <option value="3C">Grupo 3C (3.º Grado)</option>
                  </optgroup>
                </>
              ) : (
                availableGroups.map((g: string) => (
                  <option key={g} value={g}>Grupo {g}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salón Asignado</label>
              {sector === Sector.SECONDARY && selectedRoom && selectedRoom !== 'Todos' && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-${vibrant}/10 text-${vibrant}`}>
                  {selectedRoom.startsWith('1') ? '1.º Grado' : selectedRoom.startsWith('2') ? '2.º Grado' : '3.º Grado'}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={16} className={`text-${vibrant}`} />
              </div>
              <select 
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className={`w-full pl-12 pr-5 py-4 rounded-2xl border-2 transition-all focus:border-${vibrant} focus:ring-4 focus:ring-${vibrant}/10 font-bold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
              >
                {sector === Sector.PREPARATORY ? (
                  PREPARATORY_ROOMS.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))
                ) : (
                  <>
                    <optgroup label="1.º Grado">
                      <option value="1A">Salón 1A (1.º Grado)</option>
                      <option value="1B">Salón 1B (1.º Grado)</option>
                      <option value="1C">Salón 1C (1.º Grado)</option>
                    </optgroup>
                    <optgroup label="2.º Grado">
                      <option value="2A">Salón 2A (2.º Grado)</option>
                      <option value="2B">Salón 2B (2.º Grado)</option>
                      <option value="2C">Salón 2C (2.º Grado)</option>
                    </optgroup>
                    <optgroup label="3.º Grado">
                      <option value="3A">Salón 3A (3.º Grado)</option>
                      <option value="3B">Salón 3B (3.º Grado)</option>
                      <option value="3C">Salón 3C (3.º Grado)</option>
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* AI Optimization Settings */}
        <div className={`mt-6 p-5 rounded-3xl border ${isDarkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 shadow-sm border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preferencias de Optimización de la IA</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optDoubleSessions} 
                onChange={(e) => setOptDoubleSessions(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Optimizar Sesiones Dobles</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Bloques continuados de 80-120 min</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optBalanceTeachers} 
                onChange={(e) => setOptBalanceTeachers(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Equilibrar Carga Docente</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Asignación equitativa sin burnout</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optNoGaps} 
                onChange={(e) => setOptNoGaps(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Cohesión del Plan Escolar</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Distribución proporcional del temario</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optDynamicRecesses} 
                onChange={(e) => setOptDynamicRecesses(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Recreos Dinámicos</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Asignar recreos automáticamente si no hay fijos.</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optSimultaneousLimit} 
                onChange={(e) => setOptSimultaneousLimit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Límite de Clases Simultáneas</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Máximo 2 clases de la misma materia simultáneamente (Prepa y Sec).</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-slate-500/5 transition-all border ${isDarkMode ? 'border-gray-800/80' : 'border-slate-200'}`}>
              <input 
                type="checkbox" 
                checked={optEnglishBlocks} 
                onChange={(e) => setOptEnglishBlocks(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-0"
              />
              <div>
                <p className="text-xs font-black">Bloques de Inglés Unificados</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">Síncrono en Prep (Sem 1-2: 5h/sem. Sem 3-6: 3h/sem dinámico y disperso).</p>
              </div>
            </label>
          </div>
        </div>

        {/* Division & Semester Selection Controls for Preparatoria */}
        {sector === Sector.PREPARATORY && (
          <div className={`mt-6 p-6 rounded-[2rem] border ${isDarkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50/50 shadow-sm border-slate-100'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-dashed border-slate-205 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className={`text-${themeColor}-500`} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Filtrar Semestres para Generación</h4>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5">Elige qué semestres diseñar; los omitidos se conservarán intactos.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setGenSemesters([1, 2, 3, 4, 5, 6])}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${genSemesters.length === 6 ? `bg-${themeColor}-500/10 border-${themeColor}-500 text-${themeColor}-500` : 'border-slate-200 dark:border-gray-800 text-gray-400 hover:text-gray-300'}`}
                >
                  Todos (1º a 6º)
                </button>
                <button
                  type="button"
                  onClick={() => setGenSemesters([1, 3, 5])}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${[...genSemesters].sort().join(',') === '1,3,5' ? `bg-${themeColor}-500/10 border-${themeColor}-500 text-${themeColor}-500` : 'border-slate-200 dark:border-gray-800 text-gray-400 hover:text-gray-300'}`}
                >
                  Nones (1º, 3º, 5º)
                </button>
                <button
                  type="button"
                  onClick={() => setGenSemesters([2, 4, 6])}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${[...genSemesters].sort().join(',') === '2,4,6' ? `bg-${themeColor}-500/10 border-${themeColor}-500 text-${themeColor}-500` : 'border-slate-200 dark:border-gray-800 text-gray-400 hover:text-gray-300'}`}
                >
                  Pares (2º, 4º, 6º)
                </button>
                <button
                  type="button"
                  onClick={() => setGenSemesters([1, 3, 4])}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all border ${[...genSemesters].sort().join(',') === '1,3,4' ? `bg-${themeColor}-500/10 border-${themeColor}-500 text-${themeColor}-500` : 'border-slate-200 dark:border-gray-800 text-gray-400 hover:text-gray-300'}`}
                >
                  Pedido (1º, 3º, 4º)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map(sem => {
                const isSelected = genSemesters.includes(sem);
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => {
                      setGenSemesters(prev => {
                        if (prev.includes(sem)) {
                          if (prev.length <= 1) return prev; // Always leave at least one
                          return prev.filter(s => s !== sem);
                        } else {
                          return [...prev, sem].sort();
                        }
                      });
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all font-bold text-center text-xs flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${isSelected ? `bg-${themeColor}-500/10 border-${themeColor}-500 text-${themeColor}-500` : 'border-slate-150 dark:border-gray-800 hover:border-gray-400 text-gray-400'}`}
                  >
                    <span className="text-sm font-black">{sem}º Semestre</span>
                    <span className="text-[8px] uppercase tracking-widest opacity-70">
                      {isSelected ? '✓ Seleccionado' : 'Omitido'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || availabilities.length === 0}
            className={`w-full py-4 bg-${vibrant} text-white font-black rounded-2xl shadow-xl shadow-${themeColor}-900/30 hover:scale-[1.01] active:scale-95 transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            GENERAR GRUPO
          </button>
          
          <button 
            onClick={handleGenerateAll}
            disabled={isGenerating || availabilities.length === 0}
            className={`w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LayoutGrid size={16} />
            )}
            {sector === Sector.PREPARATORY ? (
              genSemesters.length === 6 
                ? "GENERAR TODOS LOS SEMESTRES" 
                : `GENERAR SEMESTRES: ${genSemesters.map(s => `${s}º`).join(', ')}`
            ) : (
              "GENERAR HORARIO COMPLETO"
            )}
          </button>

          <button 
            onClick={() => setViewMode(viewMode === 'general' ? 'generator' : 'general')}
            className={`w-full py-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-slate-800 text-white'} font-black rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-[10px] tracking-widest uppercase flex items-center justify-center gap-2`}
          >
            <Clock size={16} />
            {viewMode === 'general' ? 'VOLVER A GENERADOR' : 'HORARIO GENERAL'}
          </button>
        </div>
      </div>

      {viewMode === 'general' && (
        <div className={`w-full max-w-6xl rounded-[2.5rem] border shadow-2xl overflow-hidden mb-10 animate-in slide-in-from-bottom-8 duration-700 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Clock size={24} />
               </div>
               <div>
                  <h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Horario General de Profesores</h3>
                  <p className="text-xs text-gray-500">Ubicación de maestros para {sector}</p>
               </div>
            </div>
          </div>
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
                   {availabilities.map(teacher => (
                      <tr key={teacher.id} className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                         <td className={`p-4 font-bold text-sm border-r sticky left-0 z-10 ${isDarkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-slate-900 border-slate-100'}`}>
                           {teacher.name}
                           <div className="text-[10px] text-gray-500 font-normal mt-1">{teacher.subject}</div>
                         </td>
                         {days.map(day => (
                            <td key={`${teacher.id}-${day}`} className={`p-2 border-r last:border-r-0 min-w-[200px] align-top ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                               <div className="flex flex-col gap-1">
                                  {hours.map(hour => {
                                     const cl = allClasses.find(c => c.teacher === teacher.name && c.day === day && c.hour === hour && c.sector === sector);
                                     if (!cl) return null;
                                     return (
                                        <div key={`${day}-${hour}`} className={`p-2 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                           <span className="text-[10px] font-black w-14 text-gray-400">{hour}</span>
                                           <div className="flex-1 ml-2 text-right">
                                              <div className="text-xs font-bold text-indigo-500 truncate">{cl.group}</div>
                                              <div className="text-[9px] font-bold text-gray-500 truncate">{cl.room}</div>
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>
                            </td>
                         ))}
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
         </div>
       )}

      {/* Calendar Preview Grid */}
      {stagedClasses && viewMode === 'generator' && (
        <div className={`w-full max-w-5xl rounded-[2.5rem] border shadow-2xl overflow-hidden mb-10 animate-in slide-in-from-bottom-8 duration-700 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-${vibrant}/10 text-${vibrant}`}>
                <LayoutGrid size={24} />
              </div>
              <div>
                <h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Prototipo: {selectedRoom === 'Todos' ? 'Vista Previa de Salones' : selectedRoom}
                </h3>
                <p className="text-xs text-gray-500">Materia(s) programada(s): {stagedClasses.filter(c => c.sector === sector && (selectedRoom === 'Todos' || c.room === selectedRoom)).length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleKeepPrototype}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Save size={16} /> MANTENER {selectedRoom === 'Todos' ? 'TODOS' : ''}
              </button>
              <button 
                onClick={handleDiscardPrototype}
                className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-rose-500/10 hover:text-rose-500 transition-all ${isDarkMode ? 'text-gray-400' : 'text-slate-400'}`}
              >
                <Trash2 size={16} /> ELIMINAR
              </button>
            </div>
          </div>
          {selectedRoom === 'Todos' && (
            <div className={`p-4 border-b overflow-x-auto min-h-[64px] scrollbar-thin scrollbar-thumb-${themeColor}-500 scrollbar-track-transparent whitespace-nowrap flex gap-2 items-center ${isDarkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest mr-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                PREVISUALIZAR GRUPO:
              </span>
              {sector === Sector.PREPARATORY ? (
                 [1, 2, 3, 4, 5, 6].flatMap(sem => {
                   const groupsForSem = (sectorConfig as any).groups[sem];
                   return groupsForSem.map((grp: string) => {
                     const isSelected = previewSem === sem && previewGroup === grp;
                     return (
                       <button
                         key={`${sem}-${grp}`}
                         onClick={() => { setPreviewSem(sem); setPreviewGroup(grp); }}
                         className={`px-4 py-2 flex-shrink-0 rounded-xl text-xs font-bold transition-all ${isSelected ? `bg-${vibrant} text-white shadow-md shadow-${themeColor}-500/20` : isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                       >
                         {sem}º {grp}
                       </button>
                     );
                   });
                 })
               ) : (
                 availableGroups.map((grp: string) => {
                   const isSelected = previewGroup === grp;
                   return (
                     <button
                       key={grp}
                       onClick={() => setPreviewGroup(grp)}
                       className={`px-4 py-2 flex-shrink-0 rounded-xl text-xs font-bold transition-all ${isSelected ? `bg-${vibrant} text-white shadow-md shadow-${themeColor}-500/20` : isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                     >
                       {grp} {sector === Sector.SECONDARY && `(${grp.startsWith('1') ? '1.º' : grp.startsWith('2') ? '2.º' : '3.º'} Grado)`}
                     </button>
                   );
                 })
               )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={isDarkMode ? 'bg-gray-950' : 'bg-slate-50'}>
                  <th className={`p-4 text-left text-[10px] font-black text-gray-400 uppercase w-20 border-r ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>Hora</th>
                  {days.map(d => (
                    <th key={d} className={`p-4 text-center text-[10px] font-black uppercase text-gray-400 border-r last:border-r-0 ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => {
                  const isRecess = recesses.includes(hour);
                  if (isRecess) {
                    return (
                      <tr key={hour} className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                        <td className={`p-4 text-[10px] font-black text-center text-amber-500 border-r ${isDarkMode ? 'bg-amber-950/20 border-gray-800' : 'bg-amber-50/20 border-white'}`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <Coffee size={12} className="text-amber-500 animate-pulse" />
                            <span>{hour}</span>
                          </div>
                        </td>
                        <td 
                          colSpan={days.length} 
                          className={`p-4 text-center font-black tracking-[0.25em] text-[10px] uppercase ${
                            isDarkMode ? 'bg-amber-500/10 text-amber-500 border-gray-800' : 'bg-amber-50/40 text-amber-600 border-white'
                          }`}
                        >
                          ☕ RECREO ESCOLAR / RECESO
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={hour} className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
                      <td className={`p-4 text-[10px] font-black text-center text-gray-500 border-r ${isDarkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-slate-50/40 border-white'}`}>{hour}</td>
                      {days.map(day => {
                        const effSem = selectedRoom === 'Todos' ? previewSem : selectedSem;
                        const effGroup = selectedRoom === 'Todos' ? previewGroup : selectedGroup;
                        const groupName = sector === Sector.PREPARATORY ? `${effSem}º ${effGroup}` : effGroup;
                        const c = stagedClasses.find(cl => cl.day === day && cl.hour === hour && cl.group === groupName && cl.sector === sector);
                        return (
                          <td 
                            key={`${day}-${hour}`} 
                            onClick={() => {
                              if (c) {
                                setEditingCell({ day, hour, classItem: c });
                              } else {
                                setEditingCell({ 
                                  day, 
                                  hour, 
                                  classItem: { 
                                    id: '', 
                                    subject: '', 
                                    teacher: '', 
                                    room: selectedRoom === 'Todos' ? `SEMESTRE ${effSem} - ${effGroup}` : selectedRoom, 
                                    day, 
                                    hour, 
                                    sector, 
                                    group: groupName 
                                  } 
                                });
                              }
                            }}
                            className={`p-2 border-r last:border-r-0 min-w-[145px] h-24 cursor-pointer hover:bg-slate-500/5 transition-all ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}
                          >
                            {c ? (
                              <div className={`w-full h-full p-2.5 rounded-xl bg-${vibrant}/10 border border-${vibrant}/30 flex flex-col justify-center animate-in zoom-in-95 group relative hover:border-${vibrant} transition-all`}>
                                <p className={`text-[10px] font-black uppercase tracking-tight truncate text-${vibrant}`}>{c.subject}</p>
                                <p className="text-[9px] font-bold text-gray-500 mt-1 truncate">{c.teacher}</p>
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 p-0.5 rounded border dark:border-gray-700 shadow shadow-black/10">
                                  <Plus size={10} className={`text-${vibrant} stroke-[3]`} />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full border border-dashed border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all">
                                 <Clock size={14} className="text-gray-300 dark:text-gray-800 group-hover:hidden" />
                                 <Plus size={14} className={`text-${vibrant} hidden group-hover:block animate-in zoom-in-50 duration-200`} />
                                 <span className="text-[8px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest hidden group-hover:block transition-all">ASIGNAR</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={`p-6 bg-orange-500/5 flex items-center gap-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-slate-50'}`}>
            <AlertTriangle className="text-orange-500 shrink-0 animate-pulse" size={24} />
            <p className="text-xs text-orange-600 font-medium">
               Este prototipo evita colisiones locales y globales de maestros. Haz clic en cualquier recuadro para <strong>ajustar, reasignar o eliminar materias de manera interactiva</strong>. Al darle a <strong>"MANTENER"</strong> oficiales de salón se persistirá todo oficialmente.
            </p>
          </div>
        </div>
      )}

      {/* Cell Editing & Class Assignment Modal overlays */}
      {editingCell && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders size={20} className={`text-${vibrant}`} />
                <h3 className="font-extrabold text-lg tracking-tight">Editar Sesión del Horario</h3>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                className="p-1.5 rounded-lg hover:bg-slate-500/10 transition-all text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`p-4 rounded-2xl mb-4 border ${isDarkMode ? 'bg-gray-950/40 border-gray-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[9px] tracking-wider">Día de la Semana</span>
                  <span className="font-black text-sm">{editingCell.day}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[9px] tracking-wider">Hora Módulo</span>
                  <span className="font-black text-sm">{editingCell.hour} Hrs</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                <span className="text-gray-400 font-bold block uppercase text-[9px] tracking-wider">Auditoría de Grupo</span>
                <span className="font-bold text-gray-500 dark:text-gray-300">{editingCell.classItem.group} ({editingCell.classItem.room})</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asignatura Escolar</label>
                <select
                  id="edit-subject"
                  defaultValue={editingCell.classItem.subject || (sector === Sector.PREPARATORY ? (sectorConfig as any).semesters[selectedSem]?.[0] : (sectorConfig as any).subjects?.[0]) || ''}
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:border-${vibrant} font-bold text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                  {(sector === Sector.PREPARATORY 
                    ? [...((sectorConfig as any).semesters[selectedRoom === 'Todos' ? previewSem : selectedSem] || []), ...((sectorConfig as any).specialties || []), ...((sectorConfig as any).areas || [])] 
                    : (sectorConfig as any).subjects || []
                  ).map((sub: string) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="Hora Libre">-- Hora Libre / Descanso --</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  Docente Autorizado
                </label>
                <select
                  id="edit-teacher"
                  defaultValue={editingCell.classItem.teacher || ''}
                  className={`w-full px-4 py-3 rounded-xl border transition-all focus:border-${vibrant} font-bold text-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                >
                  <option value="">-- Sin Profesor Asignado --</option>
                  {availabilities.map(t => {
                    const configured = t.slots.includes(`${editingCell.day}-${editingCell.hour}`);
                    const isBusy = stagedClasses?.some(c => c.teacher === t.name && c.day === editingCell.day && c.hour === editingCell.hour && c.id !== editingCell.classItem.id);
                    return (
                      <option 
                        key={t.id} 
                        value={t.name}
                        disabled={isBusy}
                      >
                        {t.name} - Matrícula: {t.subject || 'General'} {!configured ? '⚠️ Fuera de disponibilidad' : ''} {isBusy ? '🚫 Ocupado en otro salón' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    const selSub = (document.getElementById('edit-subject') as HTMLSelectElement).value;
                    const selTeach = (document.getElementById('edit-teacher') as HTMLSelectElement).value;
                    
                    if (selSub === 'Hora Libre') {
                      if (editingCell.classItem.id) {
                        setStagedClasses(prev => prev ? prev.filter(c => c.id !== editingCell.classItem.id) : null);
                      }
                      setEditingCell(null);
                    } else if (selTeach) {
                      handleSaveCellEdit(selSub, selTeach);
                    } else {
                      alert('Por favor selecciona un profesor para asignar oficialmente esta materia.');
                    }
                  }}
                  className={`flex-1 py-3 bg-${vibrant} text-white font-black rounded-xl hover:scale-[1.01] transition-all text-xs uppercase tracking-wider`}
                >
                  Guardar Cambios
                </button>
                {editingCell.classItem.id && (
                  <button
                    onClick={() => {
                      handleDeleteCellClass();
                    }}
                    className="px-4 py-3 bg-rose-500/10 text-rose-500 font-extrabold rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs uppercase"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Scheduler } from './components/Scheduler';
import { Availability } from './components/Availability';
import { PrototypeGenerator } from './components/PrototypeGenerator';
import { Community } from './components/Community';
import { Settings } from './components/Settings';
import { Share } from './components/Share';
import { HorarioGeneral } from './components/HorarioGeneral';
import { TeachersAvailability } from './components/TeachersAvailability';
import { Login } from './components/Login';
import { Autocorrector } from './components/Autocorrector';
import { Sector, NavItem, AppState, TeacherAvailability, User, ClassData, Message, FontSize } from './types';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { databaseService } from './databaseService';
import { GraduationCap, School } from 'lucide-react';

const getBackgroundColor = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-sky-500';
    case 'red': return 'bg-rose-500';
    case 'green': return 'bg-emerald-500';
    case 'orange': return 'bg-orange-500';
    case 'yellow': return 'bg-amber-500';
    case 'teal': return 'bg-teal-500';
    case 'indigo': return 'bg-indigo-500';
    case 'violet': return 'bg-violet-500';
    case 'pink': return 'bg-pink-500';
    case 'wine': return 'bg-rose-900';
    case 'slate': return 'bg-slate-600';
    case 'lime': return 'bg-lime-500';
    default: return 'bg-fuchsia-600';
  }
};

const App: React.FC = () => {


  const [appState, setAppState] = useState<AppState>(() => {
    // Cargar preferencias guardadas del usuario o usar valores por defecto
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('themeColor') || 'blue' : 'blue';
    const savedDarkMode = typeof window !== 'undefined' ? localStorage.getItem('isDarkMode') === 'true' : false;
    const savedLanguage = (typeof window !== 'undefined' ? localStorage.getItem('language') || 'es' : 'es') as any;
    const savedFontSize = (typeof window !== 'undefined' ? localStorage.getItem('fontSize') || 'normal' : 'normal') as FontSize;
    const savedSector = (typeof window !== 'undefined' ? (localStorage.getItem('sector') as Sector) || Sector.PREPARATORY : Sector.PREPARATORY) as Sector;
    const savedNav = (typeof window !== 'undefined' ? (localStorage.getItem('currentNav') as NavItem) || NavItem.INICIO : NavItem.INICIO) as NavItem;
    
    let savedUser: User | null = null;
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          savedUser = JSON.parse(userStr);
        }
      } catch (e) {
        console.error("Error reading saved user session", e);
      }
    }

    return {
      sector: savedSector,
      currentNav: savedNav,
      themeColor: savedTheme,
      isDarkMode: savedDarkMode,
      language: savedLanguage,
      fontSize: savedFontSize,
      currentUser: savedUser,
      selectedRoom: '',
      settings: {
        hours: ['7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00'],
        recesses: ['10:00'],
        hoursPreparatory: [
          '7:20 - 8:10', '8:10 - 9:00', '9:00 - 9:50', '9:50 - 10:40',
          '10:40 - 11:30', '11:30 - 12:20', '12:20 - 13:10', '13:10 - 13:20', '13:20 - 14:10'
        ],
        recessesPreparatory: ['13:10 - 13:20'],
        hoursSecondary: [
          '7:00 - 7:50', '7:50 - 8:40', '8:40 - 9:10', '9:10 - 10:00', '10:00 - 10:10',
          '10:10 - 11:00', '11:00 - 11:50', '11:50 - 12:40', '12:40 - 12:50', '12:50 - 13:40'
        ],
        recessesSecondary: ['8:40 - 9:10', '10:00 - 10:10', '12:40 - 12:50']
      }
    };
  });

  // Base de datos de profesores (sin etiquetas de 'mock')
  const [submittedAvailabilities, setSubmittedAvailabilities] = useState<TeacherAvailability[]>([]);
  
  // Base de datos de horarios persistente
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);

  // Mensajes de la comunidad
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Transition state
  const [isTransitioningSector, setIsTransitioningSector] = useState(false);

  // Refresh implementation
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const [availData, classData, msgData, settingsData] = await Promise.all([
        databaseService.getAvailabilities(),
        databaseService.getClasses(),
        databaseService.getMessages(),
        databaseService.getSettings()
      ]);
      
      // Clean up previously seeded "seed-prep-" teachers if they exist
      const seededTeachers = availData.filter(t => t.id.startsWith('seed-prep-'));
      if (seededTeachers.length > 0) {
        console.log(`Cleaning up ${seededTeachers.length} auto-seeded / generated demo teachers...`);
        // Delete them in the background
        seededTeachers.forEach(t => {
          databaseService.deleteAvailability(t.id).catch(err => 
            console.error(`Failed to delete seeded teacher ${t.id}:`, err)
          );
        });
      }
      
      // Use only non-seeded teachers as the current state
      const cleanAvailData = availData.filter(t => !t.id.startsWith('seed-prep-'));
      setSubmittedAvailabilities(cleanAvailData);
      setAllClasses(classData);
      setMessages(msgData);

      if (settingsData && settingsData.hours) {
        setAppState(prev => ({
          ...prev,
          settings: {
            ...settingsData,
            recesses: settingsData.recesses || []
          }
        }));
      }
    } catch (err) {
      console.error('Error al recargar datos desde base de datos:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cargar datos iniciales y configurar Firestore silencioso
  useEffect(() => {
    let unsubscribeAvailabilities: () => void;
    let unsubscribeClasses: () => void;
    let unsubscribeMessages: () => void;
    let unsubscribeSettings: () => void;

    handleRefreshData();

    // 2. Suscribirse a cambios silencios de Firestore de respaldo
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // We set the user if they were automatically logged in
        if (!appState.currentUser) {
          const newUser = {
            id: user.uid,
            name: user.displayName || 'Usuario',
            subject: 'General', 
            subjects: ['General'],
            sector: Sector.PREPARATORY,
            role: 'Docente'
          };
          setAppState(prev => ({ 
            ...prev, 
            currentUser: newUser,
            sector: Sector.PREPARATORY
          }));
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            localStorage.setItem('sector', Sector.PREPARATORY);
          }
        }

        unsubscribeAvailabilities = onSnapshot(collection(db, 'availabilities'), (snapshot) => {
          const availabilitiesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              timestamp: data.timestamp && typeof data.timestamp.toDate === 'function' 
                ? data.timestamp.toDate() 
                : (data.timestamp ? new Date(data.timestamp) : new Date())
            } as TeacherAvailability;
          });
          setSubmittedAvailabilities(availabilitiesData);
        }, (error) => {
          console.warn('Availabilities live sync inactivo (sin permisos). Cargado desde el motor activo.');
        });

        unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
          const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
          setAllClasses(classesData);
        }, (error) => {
          console.warn('Classes live sync inactivo (sin permisos). Cargado desde el motor activo.');
        });

        unsubscribeMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate() || new Date()
            } as Message;
          });
          setMessages(messagesData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
        }, (error) => {
          console.warn('Messages live sync inactivo (sin permisos). Cargado desde el motor activo.');
        });

        unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
          if (docSnap.exists()) {
            const dataState = docSnap.data() as any;
            setAppState(prev => ({
              ...prev,
              settings: {
                ...dataState,
                recesses: dataState.recesses || []
              }
            }));
          }
        }, (error) => {
          console.warn('Settings live sync inactivo (sin permisos). Cargado desde el motor activo.');
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAvailabilities) unsubscribeAvailabilities();
      if (unsubscribeClasses) unsubscribeClasses();
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [appState.currentUser]);

  // Limpiar automáticamente profesores de prueba (seed-) registrados previamente
  useEffect(() => {
    const seedTeachers = submittedAvailabilities.filter(t => t.id && t.id.startsWith('seed-'));
    if (seedTeachers.length > 0) {
      seedTeachers.forEach(async (teacher) => {
        try {
          await databaseService.deleteAvailability(teacher.id);
          setSubmittedAvailabilities(prev => prev.filter(t => t.id !== teacher.id));
        } catch (error) {
          console.error("Error al limpiar profesor semilla:", error);
        }
      });
    }
  }, [submittedAvailabilities]);

  // Guardar preferencias en localStorage ante cualquier cambio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeColor', appState.themeColor);
      localStorage.setItem('isDarkMode', String(appState.isDarkMode));
      localStorage.setItem('language', appState.language);
      localStorage.setItem('fontSize', appState.fontSize || 'normal');
    }
  }, [appState.themeColor, appState.isDarkMode, appState.language, appState.fontSize]);

  // Aplicar escala de tamaño de letra global al elemento raíz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (appState.fontSize === 'small') {
        root.style.fontSize = '14px';
      } else if (appState.fontSize === 'large') {
        root.style.fontSize = '18.5px';
      } else {
        root.style.fontSize = '16px';
      }
    }
  }, [appState.fontSize]);

  const handleNavChange = (nav: NavItem) => {
    setAppState(prev => ({ ...prev, currentNav: nav }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentNav', nav);
    }
  };

  const handleLogin = (user: User) => {
    setAppState(prev => ({ 
      ...prev, 
      currentUser: user,
      sector: user.sector 
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('sector', user.sector);
    }

    // Agregar al profesor a la lista si no existe
    setSubmittedAvailabilities(prev => {
      const exists = prev.some(a => a.name === user.name);
      if (exists) return prev;
      
      const newEntry: TeacherAvailability = {
        id: user.id,
        name: user.name,
        subject: user.subject,
        slots: [],
        timestamp: new Date()
      };
      return [...prev, newEntry];
    });
  };

  const handleLogout = () => {
    setAppState(prev => ({ ...prev, currentUser: null }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentNav');
      localStorage.removeItem('sector');
    }
  };

  const toggleSector = () => {
    const newSector = appState.sector === Sector.PREPARATORY ? Sector.SECONDARY : Sector.PREPARATORY;
    setAppState(prev => ({
      ...prev,
      sector: newSector
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('sector', newSector);
    }
    
    // Trigger crossfade transition effect
    setIsTransitioningSector(true);
    setTimeout(() => setIsTransitioningSector(false), 800);
  };

  const updateSettings = async (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
    
    // If settings were updated, save them to the databaseService
    if (updates.settings) {
      try {
        await databaseService.saveSettings(updates.settings);
      } catch (error) {
        console.error("Error al guardar ajustes en base de datos:", error);
      }
    }
  };

  const handleUpdateClasses = async (newClasses: ClassData[]) => {
    const oldClasses = [...allClasses];
    setAllClasses(newClasses);
    try {
      await databaseService.saveClasses(newClasses, oldClasses);
    } catch (error) {
      console.error("Error al guardar clases en base de datos:", error);
    }
  };

  const registerAvailability = async (slots: string[]) => {
    if (!appState.currentUser) return;

    const newRecordId = `doc-${Date.now()}`;
    const newRecord: TeacherAvailability = {
      id: newRecordId,
      name: appState.currentUser.name,
      subject: appState.currentUser.subject,
      slots: slots,
      timestamp: new Date()
    };
    
    setSubmittedAvailabilities(prev => {
      const filtered = prev.filter(a => a.id !== newRecordId);
      return [...filtered, newRecord];
    });

    try {
      await databaseService.saveAvailability(newRecord);
    } catch (error) {
      console.error("Error al guardar disponibilidad:", error);
    }

    // Redirección inmediata a la lista de profesores tras la animación de éxito en el componente
    setTimeout(() => {
      handleNavChange(NavItem.PROFESORES);
    }, 100);
  };

  const handleSendMessage = async (content: string) => {
    if (!appState.currentUser) return;
    
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      sender: appState.currentUser.name,
      content: content,
      isOfficial: appState.currentUser.role === 'admin' || appState.currentUser.role === 'Docente',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      await databaseService.saveMessage(newMessage);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const handleClearSectorClasses = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar TODOS los horarios de ${appState.sector}? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await databaseService.deleteClassesBySector(appState.sector, allClasses);
      setAllClasses(prev => prev.filter(c => c.sector !== appState.sector));
      alert('Clases eliminadas con éxito.');
    } catch (error) {
      console.error("Error al eliminar horarios del sector:", error);
    }
  };

  const renderContent = () => {
    const { sector, themeColor, isDarkMode, language, currentUser } = appState;
    
    // Calculate real-time stats for the dashboard
    const sectorClasses = allClasses.filter(c => c.sector === sector);
    const sectorTeachers = submittedAvailabilities.filter(t => !t.sector || t.sector === sector);
    
    const uniqueRooms = new Set(sectorClasses.map(c => c.room)).size;
    const uniqueSubjects = new Set(sectorClasses.map(c => c.subject)).size;
    const uniqueGroups = new Set(sectorClasses.map(c => c.group)).size;
    
    const maxSlotsPerTeacher = 40; // Approx 8 slots per day * 5 days
    const totalPotentialSlots = sectorTeachers.length * maxSlotsPerTeacher;
    const totalFilledSlots = sectorTeachers.reduce((acc, curr) => acc + (curr.slots ? curr.slots.length : 0), 0);
    const availabilityPercentage = totalPotentialSlots > 0 
      ? Math.round((totalFilledSlots / totalPotentialSlots) * 100) 
      : 0;

    const stats = {
      totalClasses: sectorClasses.length,
      activeTeachers: sectorTeachers.length,
      availabilityPercentage: availabilityPercentage.toString(),
      roomsInUse: uniqueRooms,
      registeredSubjects: uniqueSubjects,
      groupsCount: uniqueGroups
    };

    const currentHours = appState.sector === Sector.PREPARATORY 
      ? (appState.settings.hoursPreparatory?.length ? appState.settings.hoursPreparatory : appState.settings.hours)
      : (appState.settings.hoursSecondary?.length ? appState.settings.hoursSecondary : appState.settings.hours);

    const currentRecesses = appState.sector === Sector.PREPARATORY
      ? (appState.settings.recessesPreparatory || appState.settings.recesses || [])
      : (appState.settings.recessesSecondary || appState.settings.recesses || []);

    switch (appState.currentNav) {
      case NavItem.INICIO:
        return (
          <Dashboard 
            sector={sector} 
            themeColor={themeColor} 
            isDarkMode={isDarkMode} 
            language={language} 
            stats={stats} 
            availabilities={sectorTeachers}
            onNavigate={handleNavChange}
          />
        );
      case NavItem.HORARIOS:
        return (
          <Scheduler 
            sector={sector} 
            themeColor={themeColor} 
            isDarkMode={isDarkMode} 
            currentUser={currentUser} 
            allClasses={allClasses}
            onUpdateClasses={handleUpdateClasses}
            availabilities={sectorTeachers}
            selectedRoom={appState.selectedRoom}
            onRoomChange={(room) => setAppState(prev => ({ ...prev, selectedRoom: room }))}
            hours={currentHours}
            recesses={currentRecesses}
            onUpdateSettings={updateSettings}
            onRefreshData={handleRefreshData}
          />
        );
      case NavItem.DISPONIBILIDAD:
        return <Availability themeColor={themeColor} isDarkMode={isDarkMode} onSave={registerAvailability} currentUser={currentUser} hours={currentHours} recesses={currentRecesses} />;
      case NavItem.PROTOTIPO:
        return (
          <PrototypeGenerator 
            sector={sector}
            themeColor={themeColor}
            isDarkMode={isDarkMode}
            availabilities={sectorTeachers}
            allClasses={allClasses}
            onUpdateClasses={handleUpdateClasses}
            onNavigateToScheduler={(room) => {
              setAppState(prev => ({ ...prev, currentNav: NavItem.HORARIOS, selectedRoom: room }));
            }}
            hours={currentHours}
            recesses={currentRecesses}
          />
        );
      case NavItem.PROFESORES:
        return (
          <TeachersAvailability 
            availabilities={submittedAvailabilities.filter(t => !t.sector || t.sector === sector)} 
            allAvailabilities={submittedAvailabilities}
            themeColor={themeColor} 
            isDarkMode={isDarkMode}
            hours={currentHours}
            sector={sector}
            onSaveTeacher={async (record) => {
              try {
                const updatedRecord = { ...record, sector: record.sector || sector };
                setSubmittedAvailabilities(prev => {
                  const filtered = prev.filter(t => t.id !== record.id);
                  return [...filtered, updatedRecord];
                });
                await databaseService.saveAvailability(updatedRecord);
              } catch (error) {
                console.error("Error al registrar disponibilidad del profesor:", error);
              }
            }}
            onDeleteTeacher={async (id) => {
              try {
                setSubmittedAvailabilities(prev => prev.filter(t => t.id !== id));
                await databaseService.deleteAvailability(id);
              } catch (error) {
                console.error("Error al eliminar disponibilidad del profesor:", error);
              }
            }}
            onRefreshData={handleRefreshData}
          />
        );
      case NavItem.COMUNIDAD:
        return (
          <Community 
            themeColor={themeColor} 
            isDarkMode={isDarkMode} 
            currentUser={currentUser} 
            teachers={submittedAvailabilities} 
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        );
      case NavItem.HORARIO_GENERAL:
        return (
          <HorarioGeneral
            allClasses={allClasses}
            availabilities={sectorTeachers}
            allAvailabilities={submittedAvailabilities}
            hours={currentHours}
            sector={sector}
            isDarkMode={isDarkMode}
            themeColor={themeColor}
            language={language}
            currentUser={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRefreshData={handleRefreshData}
          />
        );
      case NavItem.COMPARTIR:
        return <Share themeColor={themeColor} isDarkMode={isDarkMode} language={language} />;
      case NavItem.AJUSTES:
        return <Settings appState={appState} onUpdate={updateSettings} onClearSectorClasses={handleClearSectorClasses} />;
      case NavItem.AUTOCORRECTOR:
        return <Autocorrector isDarkMode={isDarkMode} themeColor={themeColor} />;
      default:
        return <Dashboard sector={sector} themeColor={themeColor} isDarkMode={isDarkMode} language={language} stats={stats} availabilities={submittedAvailabilities} onNavigate={handleNavChange} />;
    }
  };

  if (!appState.currentUser) {
    return <Login onLogin={handleLogin} isDarkMode={appState.isDarkMode} />;
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${appState.isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Super overlay crossfade transition */}
      {isTransitioningSector && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 ${appState.isDarkMode ? 'bg-gray-900/95 text-white' : 'bg-white/95 text-slate-900'} backdrop-blur-md`}>
          <div className={`p-6 rounded-3xl ${getBackgroundColor(appState.themeColor)} text-white shadow-2xl animate-bounce`}>
             {appState.sector === Sector.PREPARATORY ? <GraduationCap size={64} /> : <School size={64} />}
          </div>
          <h2 className="mt-8 tracking-tight font-black text-4xl text-center uppercase drop-shadow-sm">
            Cambiando a {appState.sector === Sector.PREPARATORY ? 'Preparatoria' : 'Secundaria'}
          </h2>
          <p className="mt-2 text-sm font-semibold tracking-widest uppercase opacity-70">
            Actualizando Módulos...
          </p>
        </div>
      )}

      <Sidebar 
        currentNav={appState.currentNav} 
        onNavChange={handleNavChange} 
        sector={appState.sector}
        onToggleSector={toggleSector}
        themeColor={appState.themeColor}
        isDarkMode={appState.isDarkMode}
        language={appState.language}
        currentUser={appState.currentUser}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 pt-20 lg:pt-10 relative">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

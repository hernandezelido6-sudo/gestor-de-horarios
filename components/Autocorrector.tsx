import React, { useState, useRef, useEffect } from 'react';
import { SpellCheck, Type, Key, CheckCircle, Lightbulb } from 'lucide-react';

const COMMON_TYPOS: Record<string, string> = {
  'q': 'que',
  'k': 'que',
  'xq': 'porque',
  'pq': 'porque',
  'porqe': 'porque',
  'ola': 'hola',
  'haci': 'así',
  'asi': 'así',
  'aser': 'hacer',
  'asta': 'hasta',
  'ahy': 'ahí',
  'ai': 'ahí',
  'hay': 'ahí', // common mistake depending on context, but hard to correct safely, let's keep only obvious ones
  'valla': 'vaya',
  'lla': 'ya',
  'nesesito': 'necesito',
  'esprecion': 'expresión',
  'ortografia': 'ortografía',
  'matematicas': 'matemáticas',
  'ingles': 'inglés',
  'biologia': 'biología',
  'quimica': 'química',
  'fisica': 'física',
  'historia': 'historia',
  'geografia': 'geografía',
  'tambien': 'también',
  'despues': 'después',
  'mas': 'más',
  'arbol': 'árbol',
  'lapiz': 'lápiz',
  'examenes': 'exámenes',
  'jovenes': 'jóvenes',
  'computadora': 'computadora',
  'telefono': 'teléfono',
  'musica': 'música',
  'salon': 'salón',
  'direccion': 'dirección',
  'corazon': 'corazón',
  'cancion': 'canción',
  'educacion': 'educación',
  'evaluacion': 'evaluación',
  'planeacion': 'planeación',
  'dia': 'día',
  'habia': 'había',
  'tenia': 'tenía',
  'podria': 'podría'
};

const DICTIONARY = [
  'hola', 'que', 'porque', 'así', 'hacer', 'hasta', 'ahí', 'vaya', 'ya', 'necesito',
  'expresión', 'ortografía', 'matemáticas', 'inglés', 'biología', 'química', 'física',
  'historia', 'geografía', 'literatura', 'filosofía', 'profesor', 'maestro', 'alumno',
  'estudiante', 'escuela', 'colegio', 'preparatoria', 'secundaria', 'educación', 'aprendizaje',
  'enseñanza', 'evaluación', 'calificación', 'examen', 'tarea', 'proyecto', 'presentación',
  'laboratorio', 'biblioteca', 'computación', 'tecnología', 'informática', 'programación',
  'desarrollo', 'sistema', 'aplicación', 'software', 'hardware', 'internet', 'redes',
  'seguridad', 'datos', 'información', 'comunicación', 'sociedad', 'cultura', 'arte',
  'deporte', 'salud', 'bienestar', 'psicología', 'orientación', 'tutoría', 'coordinación',
  'dirección', 'computadora', 'pluma', 'cuaderno', 'mochila', 'salón', 'aula', 'pizarrón',
  'borrador', 'receso', 'cafetería', 'director', 'coordinador', 'prefecto', 'secretaria',
  'inscripción', 'credencial', 'boleta', 'certificado', 'asistencia', 'falta', 'justificante',
  'semestre', 'bimestre', 'trimestre', 'materia', 'asignatura', 'taller', 'club', 'equipo',
  'compañero', 'amigo', 'grupo', 'turno', 'matutino', 'vespertino', 'horario', 'clase',
  'actividad', 'participación', 'exposición', 'ensayo', 'resumen', 'reporte', 'investigación'
];

interface AutocorrectorProps {
  isDarkMode?: boolean;
  themeColor?: string;
}

export const Autocorrector: React.FC<AutocorrectorProps> = ({ isDarkMode, themeColor = 'blue' }) => {
  const [text, setText] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [lastCorrected, setLastCorrected] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Vibrant color utility mapping
  const vibrant = (() => {
    switch (themeColor) {
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
  })();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Auto-correct logic triggers on space or punctuation
    const lastChar = newText.slice(-1);
    const isWordBoundary = /[\s.,!?;:]/.test(lastChar);
    
    let processedText = newText;
    
    if (isWordBoundary && newText.length > text.length) {
      const words = newText.split(/([\s.,!?;:]+)/);
      const lastWordIndex = words.length - 3; // The word before the current boundary and boundary itself
      
      if (lastWordIndex >= 0) {
        const lastWord = words[lastWordIndex].toLowerCase();
        if (COMMON_TYPOS[lastWord]) {
          const replacement = COMMON_TYPOS[lastWord];
          // Preserve original case if it was capitalized
          const isCapitalized = words[lastWordIndex].charAt(0) === words[lastWordIndex].charAt(0).toUpperCase();
          const finalReplacement = isCapitalized ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
          
          words[lastWordIndex] = finalReplacement;
          processedText = words.join('');
          setLastCorrected(`${lastWord} -> ${finalReplacement}`);
          
          // Clear notification after 3s
          setTimeout(() => setLastCorrected(null), 3000);
        }
      }
    }

    setText(processedText);

    // Predictive text logic (autocomplete)
    const words = processedText.split(/[\s.,!?;:]+/);
    const currentWord = words[words.length - 1].toLowerCase();

    if (currentWord.length >= 3) {
      const match = DICTIONARY.find(word => word.startsWith(currentWord) && word !== currentWord);
      if (match) {
        // Find the remaining part of the suggestion
        setSuggestion(match.slice(currentWord.length));
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') && suggestion) {
      e.preventDefault();
      applySuggestion();
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setText(prev => prev + suggestion + ' ');
      setSuggestion('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Helper to render the text with the ghost suggestion
  const renderTextWithSuggestion = () => {
    return (
      <div className="relative w-full h-full text-left whitespace-pre-wrap font-sans text-base p-4">
        <span className="opacity-0">{text}</span>
        {suggestion && (
          <span 
            className="text-gray-400 cursor-pointer pointer-events-auto hover:text-blue-500 transition-colors bg-blue-50/50 dark:bg-blue-900/30 px-1 rounded -ml-1"
            onMouseDown={(e) => {
              // Use mousedown to prevent text area from losing focus
              e.preventDefault();
              applySuggestion();
            }}
            title="Tocar para completar"
          >
            {suggestion}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      <header className="mb-10 text-center">
        <div className={`w-16 h-16 mx-auto bg-gradient-to-tr from-${themeColor}-600 to-${vibrant} rounded-2xl flex items-center justify-center text-white shadow-xl mb-6`}>
           <SpellCheck size={32} />
        </div>
        <h2 className={`text-4xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Asistente de Escritura</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto">
          Escribe texto con corrección ortográfica automática y predicción de palabras al escribir al menos tres letras. 
          Toca la sugerencia (o presiona Tab) para completarla.
        </p>
      </header>

      <div className={`rounded-3xl p-8 shadow-sm transition-colors border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'}`}>
        
        <div className="mb-6 flex space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold ${suggestion ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            <Lightbulb size={16} />
            <span>Predicción</span>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold ${lastCorrected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            <CheckCircle size={16} />
            <span>Autocorrección activada</span>
          </div>
        </div>

        <div className="relative">
          {/* Actual textarea */}
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`w-full min-h-[300px] p-4 text-base font-sans leading-normal rounded-2xl border-2 resize-none transition-all outline-none z-10 relative bg-transparent
              ${isDarkMode 
                ? 'border-gray-700 hover:border-gray-600 focus:border-blue-500 text-white' 
                : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 text-slate-900'
              }`}
            placeholder="Comienza a escribir aquí... (ej. 'Yo nesesito' o empieza a teclear 'est')"
          />
          
          {/* Ghost layer for suggestion ON TOP so it can be clicked */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {renderTextWithSuggestion()}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex items-center justify-between min-h-[24px]">
          <div>
            {lastCorrected && (
              <span className="text-xs font-bold text-emerald-500 animate-in fade-in slide-in-from-left-4">
                ¡Corregido automáticamente: {lastCorrected}!
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 font-medium">
            {text.length} caracteres
          </div>
        </div>

      </div>
    </div>
  );
};

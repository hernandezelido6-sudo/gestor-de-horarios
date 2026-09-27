
import React, { useState } from 'react';
import { GraduationCap, ArrowRight, User, Mail, Lock, SwitchCamera } from 'lucide-react';
import { Sector, User as UserType } from '../types';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';

interface LoginProps {
  onLogin: (user: UserType) => void;
  isDarkMode: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');

  const processUserLogin = (user: any, fallbackName: string) => {
    onLogin({
      id: user.uid,
      name: user.displayName || fallbackName || 'Usuario',
      subject: 'General', 
      subjects: ['General'],
      sector: Sector.PREPARATORY,
      role: 'Docente'
    });
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorText('');
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      processUserLogin(result.user, '');
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      setErrorText('Error al iniciar sesión con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorText('Por favor, completa todos los campos.');
      return;
    }

    try {
      setErrorText('');
      setIsLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      processUserLogin(result.user, '');
    } catch (error: any) {
      console.error('Email Auth Error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErrorText('Credenciales incorrectas.');
      } else {
        setErrorText('Ocurrió un error en la autenticación.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-500 overflow-y-auto ${isDarkMode ? 'bg-gray-950' : 'bg-slate-50'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
        <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-400'}`}></div>
      </div>

      <div className={`relative w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border transition-all duration-500 my-8 ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-blue-900/10' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>CEJPII</h1>
          <p className="text-gray-500 font-medium text-xs text-center mt-1">Sistema de Gestión Académica | Ciclo {new Date().getFullYear()}-{new Date().getFullYear() % 100 + 1}</p>
        </div>

        {errorText && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium text-center ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {errorText}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-600' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all outline-none ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-600' 
                    : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 group mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
            {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'}`}></div>
          <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>O ingresa con</span>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-800' : 'bg-slate-200'}`}></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-3 group ${isLoading ? 'opacity-70 cursor-not-allowed' : 'mb-4'}`}
        >
          GOOGLE
        </button>

        <button 
          onClick={() => {
            onLogin({
              id: 'local-guest',
              name: 'Administrador Local',
              subject: 'General', 
              subjects: ['General'],
              sector: Sector.PREPARATORY,
              role: 'Docente'
            });
          }}
          disabled={isLoading}
          className={`w-full bg-gray-600 hover:bg-gray-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-gray-600/30 transition-all flex items-center justify-center gap-3 group ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          ACCESO LOCAL / INVITADO
        </button>

        <p className="text-center text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-10">
          © {new Date().getFullYear()} Colegio CEJPII - Gestión Académica
        </p>
      </div>
    </div>
  );
};


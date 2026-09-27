
import React, { useState, useEffect } from 'react';
import { 
  Link, 
  Share2, 
  CheckCircle2, 
  Copy, 
  Globe,
  Facebook,
  MessageCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Language } from '../types';

interface ShareProps {
  themeColor: string;
  isDarkMode: boolean;
  language: Language;
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
    title: 'Portal de Acceso',
    subtitle: 'Comparte el enlace oficial de la institución.',
    shareLink: 'Compartir Web App',
    shareLinkDesc: 'Usa el menú nativo del dispositivo.',
    shareFB: 'Facebook',
    shareWA: 'Soporte WhatsApp',
    copied: '¡Copiado!',
    invalidUrl: 'Generando enlace oficial...',
    urlLabel: 'URL Pública de Acceso',
    copyBtn: 'Copiar enlace',
    devWarning: 'Estás en modo edición. Para compartir el link "Limpio" sin código, usa el botón de "Abrir en nueva ventana" del navegador.'
  },
  en: {
    title: 'Access Portal',
    subtitle: 'Share the official institution link.',
    shareLink: 'Share Web App',
    shareLinkDesc: 'Use native device share menu.',
    shareFB: 'Facebook',
    shareWA: 'WhatsApp Support',
    copied: 'Copied!',
    invalidUrl: 'Generating official link...',
    urlLabel: 'Public Access URL',
    copyBtn: 'Copy link',
    devWarning: 'You are in edit mode. To share the "Clean" link without code, use the "Open in new window" button in the browser.'
  }
};

export const Share: React.FC<ShareProps> = ({ themeColor, isDarkMode, language }) => {
  const vibrant = getVibrantColor(themeColor);
  const t = translations[language];
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isDevEnv, setIsDevEnv] = useState(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      // Limpiamos la URL de parámetros internos del editor si existen
      const cleanUrl = url.origin + url.pathname;
      setCurrentUrl(cleanUrl);
      
      // Detectamos si es una URL interna de desarrollo
      if (cleanUrl.includes('google.com') || cleanUrl.includes('idx') || cleanUrl.includes('localhost')) {
        setIsDevEnv(true);
      }
    } catch (e) {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleShare = async (platform: string) => {
    setActiveAction(platform);
    const encodedUrl = encodeURIComponent(currentUrl);
    const shareTitle = "CEJPII - Portal Escolar";

    try {
      if (platform === 'native' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: 'Accede al portal escolar oficial de CEJPII.',
          url: currentUrl,
        });
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
      } else if (platform === 'whatsapp') {
        const supportNumber = "526122884772";
        const message = encodeURIComponent("Hola, necesito ayuda con el Portal Escolar CEJPII.");
        window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank');
      } else {
        await navigator.clipboard.writeText(currentUrl);
      }
    } catch (err) {
      await navigator.clipboard.writeText(currentUrl);
    }

    setTimeout(() => setActiveAction(null), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <header className="mb-10 flex items-center gap-6">
        <div className={`p-5 rounded-[2.5rem] bg-${vibrant} text-white shadow-xl shadow-${themeColor}-900/40`}>
          <Globe size={40} />
        </div>
        <div>
          <h2 className={`text-4xl font-black mb-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.title}</h2>
          <p className="text-gray-500 font-medium">{t.subtitle}</p>
        </div>
      </header>

      {/* URL Visualizer Card */}
      <div className={`mb-12 p-10 rounded-[3rem] border-2 transition-all relative overflow-hidden ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'}`}>
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-6 block">
          {t.urlLabel}
        </label>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className={`flex-1 flex items-center px-8 py-5 rounded-2xl border-2 font-mono text-sm overflow-hidden ${isDarkMode ? 'bg-gray-950 border-gray-800 text-emerald-400' : 'bg-slate-50 border-slate-100 text-sky-600'}`}>
            <Link size={18} className="shrink-0 mr-4 opacity-40" />
            <span className="truncate select-all">{currentUrl || t.invalidUrl}</span>
          </div>
          <button 
            onClick={() => handleShare('clipboard')}
            className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${
              activeAction === 'clipboard' 
                ? 'bg-emerald-500 text-white scale-95' 
                : `bg-${vibrant} text-white hover:scale-[1.02] shadow-xl shadow-${themeColor}-900/30`
            }`}
          >
            {activeAction === 'clipboard' ? <CheckCircle2 size={20} /> : <Copy size={20} />}
            {activeAction === 'clipboard' ? t.copied : t.copyBtn}
          </button>
        </div>

        {isDevEnv && (
          <div className={`mt-8 p-6 rounded-2xl border-2 border-dashed flex items-start gap-4 ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <AlertCircle size={22} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">Aviso de Entorno</p>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{t.devWarning}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Native Share */}
        <button 
          onClick={() => handleShare('native')}
          className={`flex flex-col items-center text-center p-10 border-2 rounded-[3rem] transition-all group ${
            activeAction === 'native' ? 'border-emerald-500 bg-emerald-500/5' : isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-slate-100 hover:shadow-2xl'
          }`}
        >
          <div className={`p-6 rounded-3xl mb-8 transition-all ${activeAction === 'native' ? 'bg-emerald-500 text-white' : `bg-${vibrant}/10 text-${vibrant} group-hover:scale-110`}`}>
            {activeAction === 'native' ? <CheckCircle2 size={40} /> : <Share2 size={40} />}
          </div>
          <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.shareLink}</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">{t.shareLinkDesc}</p>
        </button>

        {/* Facebook */}
        <button 
          onClick={() => handleShare('facebook')}
          className={`flex flex-col items-center text-center p-10 border-2 rounded-[3rem] transition-all group ${
            isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-blue-600' : 'bg-white border-slate-100 hover:shadow-2xl'
          }`}
        >
          <div className={`p-6 rounded-3xl mb-8 transition-all bg-blue-600/10 text-blue-600 group-hover:scale-110`}>
            <Facebook size={40} />
          </div>
          <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.shareFB}</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">Publicar portal en redes sociales.</p>
        </button>

        {/* WhatsApp */}
        <button 
          onClick={() => handleShare('whatsapp')}
          className={`flex flex-col items-center text-center p-10 border-2 rounded-[3rem] transition-all group ${
            isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-emerald-600' : 'bg-white border-slate-100 hover:shadow-2xl'
          }`}
        >
          <div className={`p-6 rounded-3xl mb-8 transition-all bg-emerald-600/10 text-emerald-600 group-hover:scale-110`}>
            <MessageCircle size={40} />
          </div>
          <h3 className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{t.shareWA}</h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">Contactar soporte técnico por cualquier problema.</p>
        </button>
      </div>

      <div className="mt-16 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
          © CEJPII - Plataforma de Gestión Académica
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { UsuarioEquipe } from '../types';

interface UserProfileAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UsuarioEquipe;
  onUpdateAvatar: (newAvatarUrl: string, newName?: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813693-8a30dbf20387?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
];

export const UserProfileAvatarModal: React.FC<UserProfileAvatarModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateAvatar,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || PRESET_AVATARS[0]);
  const [nome, setNome] = useState(currentUser.nome || '');
  const [customUrlInput, setCustomUrlInput] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAvatar(avatarUrl, nome.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Camera className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Minha Foto de Perfil</h3>
              <p className="text-xs text-indigo-200">Personalize seu avatar no sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt={nome}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md"
              />
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Clique no ícone de câmera para carregar do seu dispositivo
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seu Nome de Exibição
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Preset Avatars */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Ou escolha um avatar predefinido
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                    avatarUrl === url ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-12 rounded-lg object-cover" />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ou insira URL direta da imagem
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrlInput) setAvatarUrl(customUrlInput);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Foto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Briefcase, 
  Phone, 
  Building,
  Eye,
  EyeOff
} from 'lucide-react';
import { UsuarioEquipe } from '../types';
import { 
  atualizarDadosPerfil, 
  reautenticarEAtualizarSenha,
  isUserAdminTotal 
} from '../services/firebaseService';
import { compressImageFile } from '../lib/image-utils';

interface UserProfileViewProps {
  currentUser: UsuarioEquipe;
  onUpdateCurrentUser: (updated: Partial<UsuarioEquipe>) => void;
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

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onUpdateCurrentUser,
}) => {
  // Personal Info State
  const [nomeCompleto, setNomeCompleto] = useState(currentUser.nome || currentUser.nomeCompleto || '');
  const [profissao, setProfissao] = useState(currentUser.profissao || currentUser.especialidade || currentUser.cargo || '');
  const [telefone, setTelefone] = useState(currentUser.telefone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || currentUser.avatarUrl || PRESET_AVATARS[0]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Update State
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showSenhas, setShowSenhas] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.7,
          targetMaxKB: 30,
          mimeType: 'image/webp'
        });
        setAvatarUrl(compressedBase64);
      } catch {
        // Fallback para FileReader padrão
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setAvatarUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      const res = await atualizarDadosPerfil(currentUser.id, {
        nomeCompleto: nomeCompleto.trim(),
        profissao: profissao.trim(),
        telefone: telefone.trim(),
        avatarUrl: avatarUrl
      });

      if (res.success) {
        onUpdateCurrentUser({
          nome: nomeCompleto.trim(),
          nomeCompleto: nomeCompleto.trim(),
          profissao: profissao.trim(),
          cargo: profissao.trim() || currentUser.cargo,
          telefone: telefone.trim(),
          avatar_url: avatarUrl,
          avatarUrl: avatarUrl
        });
        setProfileSuccessMsg('Dados do perfil salvos com sucesso!');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg(res.error || 'Erro ao atualizar perfil.');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Erro inesperado ao salvar perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!senhaAtual) {
      setPasswordErrorMsg('Por favor, informe sua senha atual para confirmação de segurança.');
      return;
    }

    if (novaSenha.length < 6) {
      setPasswordErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setPasswordErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await reautenticarEAtualizarSenha(senhaAtual, novaSenha);
      if (res.success) {
        setPasswordSuccessMsg('Senha alterada com sucesso no Firebase Auth!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmaSenha('');
        setTimeout(() => setPasswordSuccessMsg(''), 4000);
      } else {
        setPasswordErrorMsg(res.error || 'Não foi possível alterar a senha.');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Erro ao redefinir senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt={nomeCompleto}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
              />
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {isUserAdminTotal(currentUser) ? '👑 Super Admin Master' : currentUser.role}
                </span>
                <span className="text-xs text-indigo-300">
                  ID: {currentUser.id}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {nomeCompleto || 'Meu Perfil'}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {profissao || currentUser.cargo} • {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COL 1: PERSONAL INFORMATION */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Dados Cadastrais & Especialidade
                </h3>
                <p className="text-[11px] text-slate-500">
                  Atualize seu nome de exibição e foto no sistema
                </p>
              </div>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo de Exibição
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Profissão / Especialidade Clínica
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    placeholder="Ex: Biomédica Esteta, Dermatologista..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail de Acesso (Gerenciado pelo Firebase Auth)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                O e-mail principal é protegido e vinculado à sua autenticação única.
              </p>
            </div>

            {/* Choose Preset Avatar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Foto de Perfil (Escolha rápida ou faça upload)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                      avatarUrl === url ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-10 rounded-lg object-cover" />
                    {avatarUrl === url && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* COL 2: SECURITY & PASSWORD UPDATE */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Segurança & Senha
                </h3>
                <p className="text-[11px] text-slate-500">
                  Reautenticação segura via Firebase Auth
                </p>
              </div>
            </div>
          </div>

          {passwordSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showSenhas ? "text" : "password"}
                  required
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowSenhas(!showSenhas)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nova Senha (Mínimo 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showSenhas ? "text" : "password"}
                  required
                  minLength={6}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Nova senha segura"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showSenhas ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              💡 Para sua segurança, a alteração de senha exige validação de credencial ativa no Firebase Authentication.
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{isUpdatingPassword ? 'Validando...' : 'Alterar Minha Senha'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};

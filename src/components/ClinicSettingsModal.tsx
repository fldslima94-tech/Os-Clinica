import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon,
  Phone,
  MapPin,
  FileText,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { ClinicaConfig } from '../types';

interface ClinicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClinicaConfig;
  onSaveConfig: (newConfig: ClinicaConfig) => void;
}

export const ClinicSettingsModal: React.FC<ClinicSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [nome, setNome] = useState(config.nome || 'AuraEstética - Clínica & Studio');
  const [logomarcaUrl, setLogomarcaUrl] = useState(config.logomarca_url || '');
  const [telefone, setTelefone] = useState(config.telefone || '');
  const [endereco, setEndereco] = useState(config.endereco || '');
  const [cnpj, setCnpj] = useState(config.cnpj || '');
  const [emailContato, setEmailContato] = useState(config.email_contato || '');
  const [slogan, setSlogan] = useState(config.slogan || '');

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogomarcaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      nome: nome.trim(),
      logomarca_url: logomarcaUrl.trim(),
      telefone: telefone.trim(),
      endereco: endereco.trim(),
      cnpj: cnpj.trim() || undefined,
      email_contato: emailContato.trim() || undefined,
      slogan: slogan.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Identidade Visual & Dados da Clínica</h3>
              <p className="text-xs text-indigo-200">Personalize a logomarca, cabeçalho de recibos e contratos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Logo Upload Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Logomarca Oficial do Studio / Clínica
            </label>
            <div className="flex items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-xs">
                {logomarcaUrl ? (
                  <img src={logomarcaUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Carregar Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">PNG, SVG ou JPG com fundo transparente</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Clínica / Studio *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slogan / Subtítulo
            </label>
            <input
              type="text"
              placeholder="Ex: Alta Tecnologia em Procedimentos Estéticos e Harmonização"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endereço Completo *
            </label>
            <input
              type="text"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail de Contato
            </label>
            <input
              type="email"
              placeholder="contato@clinica.com.br"
              value={emailContato}
              onChange={(e) => setEmailContato(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

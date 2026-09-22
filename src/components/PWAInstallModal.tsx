import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle2, X, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicName?: string;
  clinicLogo?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  clinicName = 'AuraEstética',
  clinicLogo,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'auto'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      }
    } else if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Brand Preview */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center shrink-0">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src="/pwa-192x192.png"
                  alt="AuraEstética"
                  className="w-full h-full object-contain rounded-xl"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PWA Nativo
                </span>
                <span className="text-[10px] text-indigo-100 font-medium">Android & iOS</span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-white leading-tight">
                Instalar {clinicName}
              </h2>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Acesse como aplicativo direto da sua tela inicial
              </p>
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'android'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Instalar no Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'ios'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Instalar no iPhone / iPad</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {installSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Aplicativo Instalado com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                O ícone já está disponível na sua gaveta de aplicativos e na tela inicial do seu aparelho.
              </p>
            </div>
          ) : isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-emerald-900">Você já está usando a versão instalada!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                O aplicativo está configurado em tela cheia com alta velocidade e suporte a dados em cache.
              </p>
            </div>
          ) : activeTab === 'android' ? (
            <div className="space-y-3">
              {/* Direct Chrome / Edge Install button if beforeinstallprompt is active */}
              {isInstallable && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-center space-y-3">
                  <p className="text-xs font-medium text-indigo-900">
                    Seu navegador suporta instalação direta com 1 clique:
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Aplicativo Agora</span>
                  </button>
                </div>
              )}

              {/* Step-by-step instructions for Android */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Passo a passo no Google Chrome ou Samsung Internet:
                </p>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Abra o menu de opções</p>
                      <p className="text-slate-500 text-[11px]">Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Selecione "Instalar aplicativo"</p>
                      <p className="text-slate-500 text-[11px]">Ou toque em <strong>"Adicionar à tela inicial"</strong> na lista de opções.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">Confirme a Instalação</p>
                      <p className="text-slate-500 text-[11px]">O ícone será adicionado diretamente à tela inicial e à lista de apps do celular.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  No <strong>iPhone ou iPad</strong>, o Safari não exibe prompts automáticos. A instalação é feita pelo menu oficial de compartilhamento:
                </p>
              </div>

              {/* Step-by-step instructions for iOS */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">1. Toque no botão de Compartilhar</p>
                    <p className="text-slate-500 text-[11px]">
                      Localizado na barra inferior do Safari (o ícone de quadrado com uma seta apontando para cima).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">2. Escolha "Adicionar à Tela de Início"</p>
                    <p className="text-slate-500 text-[11px]">
                      Role o menu de opções para cima até encontrar a opção <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">3. Toque em "Adicionar" (canto superior)</p>
                    <p className="text-slate-500 text-[11px]">
                      Pronto! O app abrirá em tela inteira sem barra de endereço, exatamente como um aplicativo nativo da App Store.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Advantages list */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Sem barras do navegador</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Acesso rápido com 1 toque</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cache e suporte offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Não consome memória</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Versão Web Progressiva (PWA)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

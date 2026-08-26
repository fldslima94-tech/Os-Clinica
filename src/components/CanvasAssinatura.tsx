import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, ShieldCheck } from 'lucide-react';

interface CanvasAssinaturaProps {
  onSalvar: (dataUrl: string) => void;
  assinaturaExistente?: string;
  largura?: number;
  altura?: number;
  obrigatorio?: boolean;
}

export const CanvasAssinatura: React.FC<CanvasAssinaturaProps> = ({
  onSalvar,
  assinaturaExistente,
  largura = 600,
  altura = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [desenhando, setDesenhando] = useState(false);
  const [temAssinatura, setTemAssinatura] = useState(!!assinaturaExistente);
  const [confirmada, setConfirmada] = useState(!!assinaturaExistente);

  // Inicializa o canvas com fundo limpo ou assinatura existente
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar traçado
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // Slate 800

    if (assinaturaExistente) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setTemAssinatura(true);
        setConfirmada(true);
      };
      img.src = assinaturaExistente;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [assinaturaExistente]);

  const obterCoordenadas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const iniciarDesenho = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = obterCoordenadas(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDesenhando(true);
    setTemAssinatura(true);
    setConfirmada(false);
  };

  const desenhar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!desenhando) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = obterCoordenadas(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finalizarDesenho = () => {
    if (desenhando) {
      setDesenhando(false);
      // Auto-salva no state para conveniência
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        onSalvar(dataUrl);
      }
    }
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTemAssinatura(false);
    setConfirmada(false);
    onSalvar('');
  };

  const confirmar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSalvar(dataUrl);
    setConfirmada(true);
  };

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-2xl p-2 transition-all shadow-inner overflow-hidden">
        
        {/* Linha guia de assinatura */}
        <div className="absolute inset-x-8 bottom-10 border-b border-slate-300 pointer-events-none flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium select-none uppercase tracking-wider">
            Assine acima da linha
          </span>
          <PenTool className="w-3.5 h-3.5 text-slate-300" />
        </div>

        <canvas
          ref={canvasRef}
          width={largura}
          height={altura}
          className="w-full h-44 sm:h-48 touch-none cursor-crosshair rounded-xl bg-slate-50/50"
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={finalizarDesenho}
          onMouseLeave={finalizarDesenho}
          onTouchStart={iniciarDesenho}
          onTouchMove={desenhar}
          onTouchEnd={finalizarDesenho}
        />

        {!temAssinatura && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 gap-1.5 p-4 text-center">
            <PenTool className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">
              Assine com o dedo no celular/tablet ou usando o mouse
            </span>
            <span className="text-[11px] text-slate-400">
              A assinatura será gravada como comprovante digital válido
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {temAssinatura && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              confirmada 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {confirmada ? 'Assinatura Capturada' : 'Assinatura em edição'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limpar}
            disabled={!temAssinatura}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>

          <button
            type="button"
            onClick={confirmar}
            disabled={!temAssinatura || confirmada}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirmar Assinatura</span>
          </button>
        </div>
      </div>
    </div>
  );
};

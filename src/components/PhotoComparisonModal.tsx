import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Columns, 
  Sliders, 
  Layers, 
  ArrowLeftRight, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Calendar, 
  Tag, 
  Info,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { FotoAntesDepois } from '../types';

export interface PhotoItem {
  id: string;
  url: string;
  label: string; // 'Antes', 'Depois', 'Retorno', etc.
  date?: string;
  procedure?: string;
  notes?: string;
}

interface PhotoComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  initialPair?: {
    photoA: PhotoItem;
    photoB: PhotoItem;
  };
  allAvailablePhotos?: PhotoItem[];
}

export const PhotoComparisonModal: React.FC<PhotoComparisonModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Paciente',
  initialPair,
  allAvailablePhotos = [],
}) => {
  // Mode: 'split' (side by side), 'slider' (interactive curtain), 'opacity' (crossfade)
  const [viewMode, setViewMode] = useState<'split' | 'slider' | 'opacity'>('split');
  
  // Selected photos
  const [photoA, setPhotoA] = useState<PhotoItem | null>(null);
  const [photoB, setPhotoB] = useState<PhotoItem | null>(null);

  // Slider curtain position (0 - 100%)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const isDraggingSlider = useRef(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  // Opacity for crossfade mode (0 - 100%)
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPhotoPickers, setShowPhotoPickers] = useState(false);

  // Initialize or update photos on open
  useEffect(() => {
    if (isOpen) {
      if (initialPair) {
        setPhotoA(initialPair.photoA);
        setPhotoB(initialPair.photoB);
      } else if (allAvailablePhotos.length >= 2) {
        setPhotoA(allAvailablePhotos[0]);
        setPhotoB(allAvailablePhotos[1]);
      } else if (allAvailablePhotos.length === 1) {
        setPhotoA(allAvailablePhotos[0]);
        setPhotoB(null);
      }
      setSliderPosition(50);
      setOverlayOpacity(50);
      setZoomLevel(1);
    }
  }, [isOpen, initialPair, allAvailablePhotos]);

  // Handle curtain slider mouse/touch drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDraggingSlider.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDraggingSlider.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Swap Left/Right
  const handleSwapPhotos = () => {
    const temp = photoA;
    setPhotoA(photoB);
    setPhotoB(temp);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 1));
  const handleResetZoom = () => setZoomLevel(1);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 ${
      isFullscreen ? '!p-0' : ''
    }`}>
      <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden text-white transition-all ${
        isFullscreen ? 'h-full w-full rounded-none border-0' : 'max-w-6xl max-h-[94vh] h-[90vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Comparador Clínico Antes & Depois
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {patientName}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Avaliação comparativa de evolução tecidual, simetria e volumetria
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Visualização lado a lado em duas colunas"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lado a Lado</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'slider' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Cortina deslizante interativa sobreposta"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cortina Interativa</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('opacity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'opacity' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
              title="Transparência e sobreposição gradual"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sobreposição</span>
            </button>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSwapPhotos}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Inverter ordem das fotos (A ↔ B)"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Selection Bar (Selector Dropdowns / Quick Picks) */}
        {allAvailablePhotos.length > 2 && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Foto A (Base / Antes):</span>
              <select
                value={photoA?.id || ''}
                onChange={(e) => {
                  const found = allAvailablePhotos.find(p => p.id === e.target.value);
                  if (found) setPhotoA(found);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {allAvailablePhotos.map(p => (
                  <option key={`a-${p.id}`} value={p.id}>
                    {p.label} - {p.procedure || 'Sem título'} ({p.date || 'Sem data'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Foto B (Comparação / Depois):</span>
              <select
                value={photoB?.id || ''}
                onChange={(e) => {
                  const found = allAvailablePhotos.find(p => p.id === e.target.value);
                  if (found) setPhotoB(found);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Selecione a foto para comparar</option>
                {allAvailablePhotos.map(p => (
                  <option key={`b-${p.id}`} value={p.id}>
                    {p.label} - {p.procedure || 'Sem título'} ({p.date || 'Sem data'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Viewport Area */}
        <div 
          className="relative flex-1 bg-black overflow-hidden flex items-center justify-center p-3 select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          
          {/* Missing photos warning */}
          {(!photoA || !photoB) ? (
            <div className="text-center p-8 text-slate-400 space-y-3">
              <Columns className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-300">Selecione duas fotos para comparar</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Para realizar a comparação clínica, certifique-se de ter pelo menos uma foto 'Antes' e uma foto 'Depois' ou duas imagens registradas.
              </p>
            </div>
          ) : viewMode === 'split' ? (
            /* MODE 1: SIDE BY SIDE (LADO A LADO) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full max-h-full items-center">
              
              {/* Card Foto A */}
              <div className="relative h-full flex flex-col items-center justify-center bg-slate-950/70 rounded-2xl border border-slate-800/80 p-2 overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-bold text-indigo-300 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>{photoA.label || 'Antes'}</span>
                  {photoA.date && <span className="text-slate-400 text-[10px] font-normal">• {photoA.date}</span>}
                </div>

                {photoA.procedure && (
                  <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[10px] text-slate-300">
                    {photoA.procedure}
                  </div>
                )}

                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={photoA.url}
                    alt={photoA.label}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-150"
                  />
                </div>

                {photoA.notes && (
                  <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-300 border border-slate-800 line-clamp-1">
                    {photoA.notes}
                  </div>
                )}
              </div>

              {/* Card Foto B */}
              <div className="relative h-full flex flex-col items-center justify-center bg-slate-950/70 rounded-2xl border border-slate-800/80 p-2 overflow-hidden">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-bold text-emerald-300 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{photoB.label || 'Depois'}</span>
                  {photoB.date && <span className="text-slate-400 text-[10px] font-normal">• {photoB.date}</span>}
                </div>

                {photoB.procedure && (
                  <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[10px] text-slate-300">
                    {photoB.procedure}
                  </div>
                )}

                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={photoB.url}
                    alt={photoB.label}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-150"
                  />
                </div>

                {photoB.notes && (
                  <div className="absolute bottom-3 inset-x-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-300 border border-slate-800 line-clamp-1">
                    {photoB.notes}
                  </div>
                )}
              </div>

            </div>
          ) : viewMode === 'slider' ? (
            /* MODE 2: INTERACTIVE CURTAIN SLIDER */
            <div 
              ref={sliderContainerRef}
              onMouseDown={handleMouseDown}
              onTouchMove={handleTouchMove}
              className="relative w-full h-full max-h-full flex items-center justify-center overflow-hidden cursor-ew-resize rounded-2xl border border-slate-800"
            >
              {/* Photo B (Underneath / Full) */}
              <img
                src={photoB.url}
                alt="Depois"
                style={{ transform: `scale(${zoomLevel})` }}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-transform duration-150"
              />

              {/* Photo A (Clipped by slider position) */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={photoA.url}
                  alt="Antes"
                  style={{ transform: `scale(${zoomLevel})` }}
                  className="absolute inset-0 w-full h-full object-contain max-w-none transition-transform duration-150"
                />
              </div>

              {/* Divider Handle Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Center Drag Handle Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-950 shadow-2xl flex items-center justify-center border-2 border-indigo-600">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-900" />
                </div>
              </div>

              {/* Floating Labels */}
              <div className="absolute top-4 left-4 z-10 bg-indigo-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/40 text-xs font-bold text-indigo-300">
                {photoA.label || 'Antes'} ({sliderPosition.toFixed(0)}%)
              </div>

              <div className="absolute top-4 right-4 z-10 bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-xs font-bold text-emerald-300">
                {photoB.label || 'Depois'} ({(100 - sliderPosition).toFixed(0)}%)
              </div>
            </div>
          ) : (
            /* MODE 3: CROSSFADE OPACITY OVERLAY */
            <div className="relative w-full h-full max-h-full flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800">
              {/* Photo A (Base) */}
              <img
                src={photoA.url}
                alt="Base"
                style={{ transform: `scale(${zoomLevel})` }}
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-150"
              />

              {/* Photo B (Overlay with Opacity) */}
              <img
                src={photoB.url}
                alt="Overlay"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  opacity: overlayOpacity / 100 
                }}
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-75"
              />

              {/* Opacity Control Slider on viewport bottom */}
              <div className="absolute bottom-4 inset-x-8 max-w-md mx-auto z-20 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{photoA.label || 'Antes'} ({100 - overlayOpacity}%)</span>
                  <span className="text-indigo-400">Opacidade: {overlayOpacity}%</span>
                  <span>{photoB.label || 'Depois'} ({overlayOpacity}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-3 sm:px-6 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-indigo-300 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                title="Redefinir zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            {viewMode === 'split' && 'Fotos exibidas lado a lado para conferência de assimetrias e linhas.'}
            {viewMode === 'slider' && 'Arraste a linha branca horizontalmente para comparar o Antes e Depois.'}
            {viewMode === 'opacity' && 'Ajuste o controle deslizante para transição gradual entre as duas fotos.'}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer ml-auto"
          >
            Fechar Comparador
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Check, 
  FlipHorizontal, 
  AlertCircle, 
  Upload, 
  Sparkles,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title?: string;
  subtitle?: string;
  patientName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capturar Foto do Paciente',
  subtitle = 'Utilize a câmera para registrar a foto clínica durante o atendimento',
  patientName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [flashEffect, setFlashEffect] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  // List available video devices
  const listCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      }
    } catch (e) {
      console.warn('Erro ao enumerar dispositivos de vídeo:', e);
    }
  };

  // Start camera stream
  const startCamera = useCallback(async (desiredFacing: 'user' | 'environment', deviceId?: string) => {
    setIsCameraStarting(true);
    setCameraError(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('A API de câmera não é suportada neste navegador ou ambiente.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: desiredFacing,
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      await listCameras();
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      let errorMsg = 'Não foi possível acessar a câmera do dispositivo.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permissão de acesso à câmera foi negada. Permita o uso da câmera nas configurações do navegador ou use o envio de arquivo.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Nenhuma câmera foi encontrada neste dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'A câmera já está sendo usada por outro aplicativo ou aba.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
    } finally {
      setIsCameraStarting(false);
    }
  }, [stream]);

  // Open camera on modal open
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera(facingMode, selectedDeviceId);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Handle camera flip (front <-> back)
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    startCamera(nextFacing);
  };

  // Capture frame from video element to high-res canvas
  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger visual flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If user camera, mirror it horizontally so it feels natural
    if (facingMode === 'user' && !selectedDeviceId) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Get high-quality JPEG data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setCapturedPhoto(photoDataUrl);

    // Temporarily pause camera stream tracks to conserve resources
    if (stream) {
      stream.getVideoTracks().forEach(t => {
        t.enabled = false;
      });
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    if (stream) {
      stream.getVideoTracks().forEach(t => {
        t.enabled = true;
      });
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      startCamera(facingMode, selectedDeviceId);
    }
  };

  // Confirm photo and pass to parent
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopCameraStream();
      onClose();
    }
  };

  // Fallback: upload file from device gallery / files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedPhoto(event.target.result as string);
        stopCameraStream();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                {patientName && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {patientName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Capture Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[420px]">
          
          {/* Flash Effect on capture */}
          {flashEffect && (
            <div className="absolute inset-0 z-30 bg-white animate-out fade-out duration-200 pointer-events-none" />
          )}

          {/* If Photo was Captured: Review Mode */}
          {capturedPhoto ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <img
                src={capturedPhoto}
                alt="Foto Capturada"
                className="max-h-[340px] sm:max-h-[420px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-700"
              />
              <div className="absolute top-6 left-6 px-3 py-1 bg-emerald-500/90 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Foto Registrada</span>
              </div>
            </div>
          ) : (
            /* Live Camera Stream Mode */
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* Hidden canvas for drawing frame */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full max-h-[460px] object-cover sm:object-contain ${
                  facingMode === 'user' && !selectedDeviceId ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Camera Starting Loader */}
              {isCameraStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 text-white gap-3 z-10">
                  <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                  <span className="text-xs font-medium text-slate-300">Iniciando câmera...</span>
                </div>
              )}

              {/* Camera Error / Fallback State */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center z-20 gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">Acesso à Câmera Indisponível</h4>
                    <p className="text-xs text-slate-400">{cameraError}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Tentar Novamente</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Carregar da Galeria</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Viewfinder Framing Overlay (Face/Target Guide) */}
              {!cameraError && !isCameraStarting && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Oval Face Guide for Clinical Portrait */}
                  <div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-white/40 border-dashed rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center relative">
                    <span className="absolute -top-6 text-[10px] uppercase font-bold tracking-wider text-white/80 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Enquadramento Facial
                    </span>
                  </div>

                  {/* Optional Rule of Thirds Grid */}
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>
                  )}

                  {/* Top Bar Quick Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setShowGrid(!showGrid)}
                      className={`p-2 rounded-xl text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
                        showGrid ? 'bg-indigo-600/80 text-white' : 'bg-black/50 text-slate-300 hover:text-white'
                      }`}
                      title={showGrid ? 'Ocultar grade' : 'Mostrar grade de alinhamento'}
                    >
                      <Sliders className="w-4 h-4" />
                    </button>

                    {availableCameras.length > 1 && (
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-all cursor-pointer"
                        title="Alternar entre câmera frontal e traseira"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Controls / Footer */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {capturedPhoto ? (
            /* Controls for Review State */
            <div className="flex items-center justify-between w-full gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tirar Outra Foto</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Foto na Ficha</span>
              </button>
            </div>
          ) : (
            /* Controls for Live Capture State */
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                title="Carregar foto salva ou arquivo"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Galeria</span>
              </button>

              {/* Large Shutter Button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  disabled={isCameraStarting || !!cameraError}
                  onClick={handleTakePhoto}
                  className="group relative p-1 rounded-full border-4 border-white/60 hover:border-white transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Capturar Foto Agora"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white group-hover:bg-indigo-100 flex items-center justify-center shadow-lg transition-all">
                    <Camera className="w-6 h-6 text-slate-900" />
                  </div>
                </button>
              </div>

              {availableCameras.length > 1 ? (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  title="Alternar Câmera"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Inverter</span>
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

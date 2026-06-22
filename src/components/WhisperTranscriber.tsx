"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  Settings,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Trash2,
  Cpu,
  Languages,
  HelpCircle,
  Search,
  Flame,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { getAudioChannelData, formatTimestamp, generateSRT } from '../utils/audioHelper';
import confetti from 'canvas-confetti';

type ModelName = 'Xenova/whisper-tiny' | 'Xenova/whisper-base';
type TaskType = 'transcribe' | 'translate';

interface Segment {
  start: number;
  end: number;
  text: string;
}

export default function WhisperTranscriber() {
  // File & Recording States
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedStream, setRecordedStream] = useState<MediaStream | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Player State
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Model Settings & Execution State
  const [selectedModel, setSelectedModel] = useState<ModelName>('Xenova/whisper-tiny');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ar');
  const [selectedTask, setSelectedTask] = useState<TaskType>('transcribe');
  
  const [statusText, setStatusText] = useState<string>('جاهز للبدء - Ready to start');
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);
  
  // Output States
  const [transcriptSegments, setTranscriptSegments] = useState<Segment[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Pipeline Cache
  const pipelineRef = useRef<any>(null);

  // Handle timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Handle drag/drop & File selection
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const loadAudioFile = (file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setTranscriptSegments([]);
    setFullText('');
    setTranscriptionTime(null);
  };

  // Microphone recording management
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordedStream(stream);
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([audioBlob], 'live_recording.wav', { type: 'audio/wav' });
        loadAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTranscriptSegments([]);
      setFullText('');
    } catch (err) {
      alert('يرجى السماح بالوصول إلى الميكروفون - Please grant microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioFile(null);
    setAudioUrl('');
    setTranscriptSegments([]);
    setFullText('');
    setTranscriptionTime(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlaying(false);
  };

  // Dynamic Model Initialization with Local Cache optimization & Fallbacks
  const getPipelineInstance = async (model: ModelName, progressCallback: (data: any) => void) => {
    const { pipeline, env } = await import('@xenova/transformers');
    
    // Enable caching for browser storage efficiency
    env.allowLocalModels = false;
    
    if (pipelineRef.current && pipelineRef.current.modelName === model) {
      return pipelineRef.current.instance;
    }

    setStatusText('جاري تنزيل ملفات النموذج من الخادم المؤقت (يحدث مرة واحدة فقط) - Downloading AI model chunks...');
    const instance = await pipeline('automatic-speech-recognition', model, {
      progress_callback: progressCallback,
    });
    
    pipelineRef.current = { modelName: model, instance };
    return instance;
  };

  const runTranscription = async () => {
    if (!audioFile) return;
    
    setIsProcessing(true);
    setTranscriptionTime(null);
    const startTime = performance.now();

    try {
      setStatusText('جاري فك تشفير الصوت وتهيئة الترددات (16kHz)...');
      const processedAudio = await getAudioChannelData(audioFile);

      // Load the model
      const whisperPipeline = await getPipelineInstance(selectedModel, (progressData: any) => {
        if (progressData.status === 'progress') {
          setModelLoadingProgress(Math.round(progressData.progress));
        } else if (progressData.status === 'ready') {
          setModelLoadingProgress(100);
          setStatusText('النموذج جاهز في ذاكرة المتصفح النشطة. يبدأ التفريغ الآن...');
        }
      });

      setStatusText('الذكاء الاصطناعي يقوم بالتفريغ الصوتي الآن... يرجى عدم إغلاق هذه الصفحة.');
      
      // Run model prediction client-side
      const result = await whisperPipeline(processedAudio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        language: selectedLanguage === 'auto' ? null : selectedLanguage,
        task: selectedTask,
      });

      // Structure segments with fallbacks
      if (result && result.chunks) {
        const formattedSegments: Segment[] = result.chunks.map((chunk: any) => ({
          start: chunk.timestamp ? chunk.timestamp[0] : 0,
          end: chunk.timestamp ? chunk.timestamp[1] : 2,
          text: chunk.text || ''
        }));
        setTranscriptSegments(formattedSegments);
        setFullText(result.text || '');
      } else {
        setFullText(result.text || 'لم يتم العثور على أي نصوص صالحة - No text was detected.');
        setTranscriptSegments([{ start: 0, end: 5, text: result.text || '' }]);
      }

      const endTime = performance.now();
      setTranscriptionTime(Math.round((endTime - startTime) / 1000));
      setStatusText('اكتملت العملية بنجاح! - Transcription Completed!');
      
      // Celebration effect
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#3b82f6', '#8b5cf6']
      });

    } catch (error: any) {
      console.error(error);
      setStatusText(`حدث خطأ أثناء المعالجة: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
      setModelLoadingProgress(0);
    }
  };

  // Copy text helper
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download handlers
  const downloadAsTXT = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audioFile?.name || 'transcript'}_tafreegh.txt`;
    link.click();
  };

  const downloadAsSRT = () => {
    const srtText = generateSRT(transcriptSegments);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audioFile?.name || 'transcript'}_tafreegh.srt`;
    link.click();
  };

  // Audio playback controls
  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToAudioTimestamp = (seconds: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = seconds;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Filter segments via search keyword
  const filteredSegments = transcriptSegments.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Top Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-darkCard/80 border border-teal-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-teal-300">حوسبة متصفح محلية (WebGPU/WASM)</h4>
            <p className="text-xs text-slate-400 mt-1">
              تجري معالجة الصوت بالكامل على جهازك دون إرساله إلى أي سيرفر لحماية تامة للخصوصية.
            </p>
          </div>
        </div>

        <div className="bg-darkCard/80 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-indigo-300">دعم كامل للغة العربية</h4>
            <p className="text-xs text-slate-400 mt-1">
              تفريغ فائق الدقة للهجات العربية الفصحى والعامية، مع خيار الترجمة الفورية للغة الإنجليزية.
            </p>
          </div>
        </div>

        <div className="bg-darkCard/80 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-300">بدون أي تكاليف إضافية</h4>
            <p className="text-xs text-slate-400 mt-1">
              لا تحتاج لاشتراكات مدفوعة أو مفاتيح API خارجية. مساحة العمل مجانية وغير محدودة بالكامل.
            </p>
          </div>
        </div>
      </div>

      {/* Main Core Area - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Inputs & Settings Panel (Left Column) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Custom Settings Configurator */}
          <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-400" />
                <h3 className="font-bold text-slate-100">إعدادات نموذج الذكاء الاصطناعي</h3>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">Whisper Engine</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2 font-semibold">
                حجم النموذج المحمل / Model Size:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModel('Xenova/whisper-tiny')}
                  className={`p-2.5 text-xs rounded-xl border font-medium transition ${selectedModel === 'Xenova/whisper-tiny' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  Whisper Tiny (75MB)
                  <span className="block text-[10px] opacity-70 mt-0.5">سرعة فائقة وخفيف جداً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('Xenova/whisper-base')}
                  className={`p-2.5 text-xs rounded-xl border font-medium transition ${selectedModel === 'Xenova/whisper-base' ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  Whisper Base (145MB)
                  <span className="block text-[10px] opacity-70 mt-0.5">دقة أعلى وتفاصيل أكثر</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">
                  لغة ملف الصوت / Language:
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-teal-500"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">الإنجليزية (English)</option>
                  <option value="auto">التعرف التلقائي (Auto-Detect)</option>
                  <option value="fr">الفرنسية (French)</option>
                  <option value="es">الإسبانية (Spanish)</option>
                  <option value="de">الألمانية (German)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2 font-semibold">
                  المهمة المطلوبة / Task:
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value as TaskType)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-teal-500"
                >
                  <option value="transcribe">تفريغ النص (Transcribe)</option>
                  <option value="translate">ترجمة للإنجليزية (Translate)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recording & Input Media Hub */}
          <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Mic className="h-5 w-5 text-teal-400" />
              إدخال الصوت والميكروفون
            </h3>

            {/* Live Visualizer Hook */}
            <AudioVisualizer isRecording={isRecording} audioStream={recordedStream} />

            {/* Live Recording Buttons */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl py-3 px-4 transition duration-200 shadow-lg shadow-red-600/10"
                >
                  <Mic className="h-4 w-4 animate-bounce" />
                  بدء تسجيل حي (Live Record)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-xl py-3 px-4 transition duration-200"
                >
                  <Square className="h-4 w-4 text-red-400" />
                  إيقاف التسجيل وحفظ ({recordingSeconds} ثواني)
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-mono uppercase">أو - Or</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Draggable File Uploader Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-950/60 relative group"
            >
              <input
                type="file"
                accept="audio/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <UploadCloud className="mx-auto h-10 w-10 text-slate-500 group-hover:text-teal-400 transition mb-3" />
              <p className="text-xs font-medium text-slate-300">
                اسحب ملف الصوت وأفلته هنا أو اضغط للتصفح
              </p>
              <p className="text-[10px] text-slate-500 mt-1.5">
                يدعم ملفات MP3, WAV, M4A, OGG
              </p>
            </div>

            {/* Audio File Loaded State Info */}
            {audioUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-teal-400 truncate max-w-[70%]">
                    {audioFile?.name || 'مقطع مسجل.wav'}
                  </span>
                  <button 
                    onClick={clearAudio} 
                    title="مسح الملف - Clear audio"
                    className="p-1 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 transition"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 text-teal-400" /> : <Play className="h-4 w-4" />}
                  </button>
                  
                  <audio 
                    ref={audioPlayerRef} 
                    src={audioUrl} 
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-8 opacity-75"
                    controls
                  />
                </div>
              </div>
            )}
          </div>

          {/* Run Action Trigger */}
          <button
            type="button"
            onClick={runTranscription}
            disabled={isProcessing || !audioFile}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-3 shadow-xl ${isProcessing ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : !audioFile ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-teal-500/10'}`}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Cpu className="h-5 w-5" />
            )}
            {isProcessing ? 'جاري التحليل واستخراج النص... - Transcribing...' : 'ابدأ التفريغ الصوتي بالذكاء الاصطناعي'}
          </button>

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="bg-darkCard border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium truncate max-w-[70%]">{statusText}</span>
                {modelLoadingProgress > 0 && <span className="text-teal-400 font-mono">{modelLoadingProgress}%</span>}
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${modelLoadingProgress || 15}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-right leading-relaxed">
                * يستغرق التنزيل الأولي للنموذج حوالي دقيقة. التفريغات اللاحقة ستكون فورية ومحلية بالكامل.
              </p>
            </div>
          )}

        </div>

        {/* Output Workspace Results Panel (Right Column) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-darkCard border border-slate-800 rounded-3xl p-6 min-h-[500px] flex flex-col">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
              <div>
                <h2 className="font-bold text-lg text-slate-100">النص المفرغ من الملف</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {transcriptionTime ? `اكتمل التفريغ خلال ${transcriptionTime} ثانية` : 'في انتظار معالجة ملف صوتي...'}
                </p>
              </div>

              {/* Actions for finished transcript */}
              {fullText && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-teal-500/30 text-slate-300 rounded-lg text-xs transition"
                    title="نسخ النص كامل"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? 'تم النسخ' : 'نسخ'}
                  </button>
                  
                  <button
                    onClick={downloadAsTXT}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-teal-500/30 text-slate-300 rounded-lg text-xs transition"
                    title="تنزيل بصيغة TXT"
                  >
                    <Download className="h-3.5 w-3.5" />
                    TXT
                  </button>

                  <button
                    onClick={downloadAsSRT}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-teal-500/30 text-teal-400 rounded-lg text-xs transition font-semibold"
                    title="تنزيل ملف ترجمة SRT للفيديو"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ترجمة SRT
                  </button>
                </div>
              )}
            </div>

            {/* Search filter for segments */}
            {transcriptSegments.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث داخل كلمات المقطع الصوتي... Search transcript..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50"
                />
              </div>
            )}

            {/* Interactive Workspace Area */}
            <div className="flex-1 overflow-y-auto max-h-[420px] pr-2 space-y-4">
              {transcriptSegments.length > 0 ? (
                <div className="space-y-3">
                  {filteredSegments.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-10">لم يتم العثور على نتائج تطابق البحث.</p>
                  ) : (
                    filteredSegments.map((segment, index) => (
                      <div 
                        key={index} 
                        onClick={() => jumpToAudioTimestamp(segment.start)}
                        className="p-3.5 bg-slate-950/50 border border-slate-800 hover:border-teal-500/40 rounded-xl cursor-pointer transition text-right group relative"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                            {formatTimestamp(segment.start)}
                          </span>
                          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">
                            اضغط للتشغيل من هذه الثانية ⚡
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {segment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium">
                      بانتظار رفع ملفك الصوتي أو تسجيل مقطع حي.
                    </p>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      عند اكتمال المعالجة بالذكاء الاصطناعي، سيظهر هنا النص مقسماً بترميز زمني دقيق للمساعدة في تحرير الفيديو والترجمات المكتوبة.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Full text quick overview area */}
            {fullText && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 mb-2">عرض النص بالكامل / Full Paragraph View</h4>
                <textarea
                  readOnly
                  value={fullText}
                  className="w-full h-24 bg-slate-950/80 border border-slate-800 text-slate-300 text-xs rounded-xl p-3 focus:outline-none focus:border-teal-500/50 resize-none font-sans leading-relaxed"
                />
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

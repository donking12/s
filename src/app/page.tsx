"use client";

import React from 'react';
import WhisperTranscriber from '../components/WhisperTranscriber';
import { Cpu, ShieldCheck, Heart, Github } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden pb-16">
      {/* Soft Background Neon Circles */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Premium Header Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800/80 pb-6 mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/10">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
                تفريغ الذكاء | Tafreegh AI
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                منصة التفريغ الصوتي المحلي الذكي الخصوصية القصوى لصناع المحتوى
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-teal-400">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>مُؤمن محلياً - On-Device Secured</span>
            </div>
          </div>
        </header>

        {/* Product Pitch Hero section */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="px-3.5 py-1 text-[11px] font-bold tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full inline-block uppercase">
            ذكاء اصطناعي آمن بدون إنترنت
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-100 leading-tight">
            حول تسجيلاتك الصوتية إلى نصوص مكتوبة وملفات ترجمة بلحظات
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            منصة متكاملة ومجانية 100% تعتمد على نموذج Whisper المتطور من OpenAI للتشغيل المباشر داخل المتصفح. تخلص من القلق بشأن خصوصية بياناتك أو فواتير استهلاك السيرفرات.
          </p>
        </div>

        {/* Core Whisper Interface Workspace */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-teal-500/10 to-indigo-500/10 blur opacity-70" />
          <div className="relative bg-darkBg/90 border border-slate-800 rounded-3xl p-1 md:p-3">
            <WhisperTranscriber />
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto space-y-8">
          <h3 className="text-xl font-bold text-center text-slate-100">الأسئلة الشائعة وتوجيهات الاستخدام</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-darkCard border border-slate-800 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-teal-300">كيف يتم تفريغ الصوت بدون سيرفرات؟</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                نستخدم مكتبة Transformers.js لتحميل النموذج الرياضي مباشرة في ذاكرة متصفحك. بمجرد انتهاء التنزيل، يقوم حاسوبك الشخصي بمعالجة الصوت كلياً مستفيداً من مسرع الرسوميات الخاص بك.
              </p>
            </div>

            <div className="bg-darkCard border border-slate-800 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-teal-300">هل ملفاتي وصوتي آمنة ومحمية؟</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                نعم، 100% وبشكل قاطع. لا نقوم برفع أو تخرين أي ملف صوتي على أي سيرفر خارجي. يمكنك حتى قطع اتصالك بالإنترنت بالكامل بعد تحميل النموذج، وسيستمر التطبيق في العمل بكفاءة.
              </p>
            </div>

            <div className="bg-darkCard border border-slate-800 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-teal-300">ما هي صيغ الصوت التي يدعمها النظام؟</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ندعم جميع الصيغ الشائعة مثل MP3, WAV, M4A, OGG. في حال حدوث بطء بالتحميل، يفضل استخدام ملفات ذات حجم معتدل ومعدل ترميز قياسي.
              </p>
            </div>

            <div className="bg-darkCard border border-slate-800 p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-sm text-teal-300">كيف أستخدم ملف SRT الذي يتم تحميله؟</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ملف SRT هو الملف القياسي لترجمات الفيديو. يمكنك رفعه مباشرة على يوتيوب، أو إدراجه داخل برامج المونتاج مثل Premiere Pro و DaVinci Resolve لإنتاج ترجمات نصية تلقائية متوافقة مع الزمن.
              </p>
            </div>
          </div>
        </div>

        {/* Creative Micro-SaaS Footer */}
        <footer className="mt-24 border-t border-slate-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <span>صنع بحب لمجتمع صناع المحتوى العربي</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </p>
          <div className="flex items-center gap-4">
            <span>Tafreegh AI Workspace © {new Date().getFullYear()}</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <a href="#" className="hover:text-teal-400 transition">الخصوصية والأمان</a>
          </div>
        </footer>

      </div>
    </main>
  );
}

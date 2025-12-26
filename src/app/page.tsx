'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Target, Users, Rocket, Activity, Check, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white selection:bg-[#FF5E00] selection:text-white overflow-x-hidden">

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo Group */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#FF5E00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF5E00]/20 rotate-3">
                <span className="text-white font-black italic text-lg">GFT</span>
              </div>
              <h2 className="hidden sm:block text-xl font-black text-zinc-900 italic tracking-tighter uppercase leading-none">
                Get Fit <br /> <span className="text-[#FF5E00]">Together</span>
              </h2>
            </div>

            <span className="text-zinc-300 font-black text-lg px-2">x</span>

            <div className="flex items-center gap-2">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-white border border-zinc-100 p-1">
                <img src="/1756451176073.jpg" alt="VYAIAM Logo" className="h-full w-full object-contain mix-blend-multiply" />
              </div>
              <span className="hidden sm:block font-black italic text-2xl tracking-tighter text-zinc-600 uppercase">VYAIAM</span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-4">
            <Link href="/auth?mode=login" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-[#FF5E00] transition-colors">
              Login
            </Link>
            <Link href="/auth?mode=register" className="bg-zinc-900 hover:bg-[#FF5E00] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-zinc-900/20 hover:shadow-[#FF5E00]/40">
              Join Squad
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF5E00]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="h-2 w-2 rounded-full bg-[#FF5E00] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5E00]">Season 1 Enrolling Now</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black text-zinc-900 italic tracking-tighter leading-[0.8] uppercase mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Fitness is <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E00] to-orange-600">Better Together.</span>
          </h1>

          <p className="text-xl sm:text-2xl font-medium text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Grab your friends, build your squad, and crush your goals.
            A simple 10-week journey to build habits that actually stick.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/auth?mode=register" className="h-14 px-8 rounded-2xl bg-[#FF5E00] text-white flex items-center gap-3 font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl shadow-[#FF5E00]/30 group">
              Start Your Journey
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth?mode=login" className="h-14 px-8 rounded-2xl bg-white border border-zinc-200 text-zinc-900 flex items-center gap-3 font-black uppercase tracking-widest text-sm hover:border-[#FF5E00] hover:text-[#FF5E00] transition-all">
              Member Login
            </Link>
          </div>

          {/* Social Proofish */}
          <div className="mt-16 pt-8 border-t border-zinc-100 max-w-md mx-auto flex items-center justify-center gap-8 animate-in fade-in duration-1000 delay-500">
            <div className="text-center">
              <span className="block text-3xl font-black italic text-zinc-900">70</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Days</span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-200" />
            <div className="text-center">
              <span className="block text-3xl font-black italic text-zinc-900">100%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Commitment</span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-200" />
            <div className="text-center">
              <span className="block text-3xl font-black italic text-zinc-900">2</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Goals</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-zinc-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-[#FF5E00] font-black uppercase tracking-[0.2em] text-sm mb-4">The Experience</h3>
            <h2 className="text-4xl lg:text-6xl font-black italic text-zinc-900 uppercase tracking-tighter">Everything You Need <br /> To Keep Going.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg shadow-zinc-200/50 hover:-translate-y-2 transition-transform duration-500 border border-zinc-100 group">
              <div className="h-16 w-16 bg-orange-50 rounded-3xl flex items-center justify-center mb-6 border border-orange-100 group-hover:bg-[#FF5E00] transition-colors group-hover:border-[#FF5E00]">
                <Rocket className="h-8 w-8 text-[#FF5E00] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black italic text-zinc-900 uppercase mb-3">Fun Workouts</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Daily workouts designed for everyone. Do them anywhere, anytime. No complicated equipment needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg shadow-zinc-200/50 hover:-translate-y-2 transition-transform duration-500 border border-zinc-100 group">
              <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-500 transition-colors group-hover:border-blue-500">
                <Activity className="h-8 w-8 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black italic text-zinc-900 uppercase mb-3">Track Progress</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Log your wins. Watch your stats grow. Simple tools to help you see how far you've come.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg shadow-zinc-200/50 hover:-translate-y-2 transition-transform duration-500 border border-zinc-100 group">
              <div className="h-16 w-16 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-200 group-hover:bg-zinc-900 transition-colors group-hover:border-zinc-900">
                <Users className="h-8 w-8 text-zinc-900 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black italic text-zinc-900 uppercase mb-3">Squad Goals</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Everything is easier with friends. Earn points for your team and celebrate victories together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS / CTA --- */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-zinc-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

          <div className="relative z-10 p-12 lg:p-24 text-center">
            <h2 className="text-4xl lg:text-7xl font-black italic text-white uppercase tracking-tighter mb-8 max-w-3xl mx-auto">
              Ready to <span className="text-[#FF5E00]">Start?</span>
            </h2>
            <p className="text-zinc-300 text-lg lg:text-xl font-medium max-w-xl mx-auto mb-12">
              Your squad is waiting. 10 weeks of fun, fitness, and friendship.
              Let's do this together.
            </p>
            <Link href="/auth?mode=register" className="inline-flex h-16 px-10 rounded-2xl bg-[#FF5E00] text-white items-center gap-3 font-black uppercase tracking-widest text-base hover:bg-white hover:text-[#FF5E00] transition-colors shadow-2xl shadow-[#FF5E00]/40">
              Join The Squad
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-zinc-100 text-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          © 2025 Get Fit Together x VYAIAM. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

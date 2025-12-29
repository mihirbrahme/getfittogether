'use client';

import { Trophy, Target, Zap, Calendar, Users, Award, TrendingUp, CheckCircle } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-black italic uppercase text-zinc-900 tracking-tighter">
                    How It <span className="text-[#FF5E00]">Works</span>
                </h1>
                <p className="text-zinc-500 font-medium text-lg">
                    Your complete guide to Get Fit Together
                </p>
            </div>

            {/* Scoring System */}
            <div className="bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-[3rem] p-12 text-white">
                <div className="flex items-center gap-4 mb-8">
                    <Trophy className="h-10 w-10" />
                    <h2 className="text-3xl font-black italic uppercase">Scoring System</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                            <Zap className="h-6 w-6" />
                            Daily Activities
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">WOD Completed</span>
                                <span className="font-black text-2xl">+20</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">8k Steps / Run</span>
                                <span className="font-black text-2xl">+10</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Clean Eating</span>
                                <span className="font-black text-2xl">+10</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">7+ Hours Sleep</span>
                                <span className="font-black text-2xl">+10</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Hydration (2.5L+)</span>
                                <span className="font-black text-2xl">+10</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/20 pt-3 mt-3">
                                <span className="font-medium">Personal Goal (each)</span>
                                <span className="font-black text-2xl">+5</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                            <Award className="h-6 w-6" />
                            Max Points
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-orange-100 mb-2">Daily Maximum (with 2 goals)</p>
                                <p className="text-5xl font-black italic">70</p>
                                <p className="text-xs text-orange-100 mt-1">20 + 10 + 10 + 10 + 10 + 5 + 5</p>
                            </div>
                            <div className="border-t border-white/20 pt-4">
                                <p className="text-sm font-medium text-orange-100 mb-2">Weekly Target</p>
                                <p className="text-4xl font-black italic">350+</p>
                                <p className="text-xs text-orange-100 mt-1">Average 50 points per day</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to Use */}
            <div className="bg-white rounded-[3rem] p-12 border border-zinc-100 shadow-sm">
                <h2 className="text-3xl font-black italic uppercase text-zinc-900 mb-8 flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-[#FF5E00]" />
                    Daily Workflow
                </h2>

                <div className="space-y-6">
                    {[
                        { num: 1, title: 'Check Today\'s WOD', desc: 'Visit the WOD tab to see your workout. Watch the video demo if available.' },
                        { num: 2, title: 'Complete Your Activities', desc: 'Do the WOD, hit your step goal, eat clean, sleep well, and stay hydrated.' },
                        { num: 3, title: 'Log Everything', desc: 'Go to Check-In and honestly log all your activities. Truth is strength!' },
                        { num: 4, title: 'Track Progress', desc: 'View your points on the Dashboard and compete with your squad.' },
                    ].map((step) => (
                        <div key={step.num} className="flex gap-6">
                            <div className="h-12 w-12 rounded-xl bg-[#FF5E00] text-white flex items-center justify-center font-black text-xl shrink-0">
                                {step.num}
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-lg text-zinc-900 mb-1">{step.title}</h3>
                                <p className="text-zinc-600 font-medium">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Guide */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm">
                    <Target className="h-8 w-8 text-[#FF5E00] mb-4" />
                    <h3 className="text-xl font-black italic uppercase text-zinc-900 mb-3">Personal Goals</h3>
                    <p className="text-zinc-600 font-medium mb-4">
                        Create custom goals that matter to you. Each completed goal earns +5 points daily.
                    </p>
                    <ul className="text-sm text-zinc-500 space-y-2 font-medium">
                        <li>• Go to Goals tab</li>
                        <li>• Add unlimited personal targets</li>
                        <li>• Pause/activate as needed</li>
                        <li>• Edit anytime</li>
                    </ul>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm">
                    <Users className="h-8 w-8 text-[#FF5E00] mb-4" />
                    <h3 className="text-xl font-black italic uppercase text-zinc-900 mb-3">Squad Competition</h3>
                    <p className="text-zinc-600 font-medium mb-4">
                        Compete with your squad members on the leaderboard. Team accountability drives results.
                    </p>
                    <ul className="text-sm text-zinc-500 space-y-2 font-medium">
                        <li>• Check Squad tab for rankings</li>
                        <li>• See everyone's total points</li>
                        <li>• Your position highlighted</li>
                        <li>• Updates in real-time</li>
                    </ul>
                </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-[3rem] p-12 border border-zinc-100 shadow-sm">
                <h2 className="text-3xl font-black italic uppercase text-zinc-900 mb-8">
                    Common Questions
                </h2>

                <div className="space-y-6">
                    {[
                        {
                            q: 'What if I miss a day?',
                            a: 'No penalties! Just get back on track the next day. Consistency over perfection.'
                        },
                        {
                            q: 'Can I change my personal goals?',
                            a: 'Yes! Edit, pause, or delete goals anytime from the Goals page.'
                        },
                        {
                            q: 'How often are points updated?',
                            a: 'Immediately after you submit your check-in. The leaderboard updates in real-time.'
                        },
                        {
                            q: 'What counts as "Clean Eating"?',
                            a: 'Whole foods, minimal processed items, portion control. Be honest with yourself!'
                        },
                        {
                            q: 'Do I need to log on weekends?',
                            a: 'Yes! Weekend WODs count and core habits still earn points. Stay consistent!'
                        },
                        {
                            q: 'Can I see my history?',
                            a: 'The dashboard shows your last 7 days. For full history, contact your admin.'
                        },
                    ].map((faq, i) => (
                        <div key={i} className="border-l-4 border-[#FF5E00] pl-6 py-2">
                            <h4 className="font-black text-zinc-900 mb-2">{faq.q}</h4>
                            <p className="text-zinc-600 font-medium">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Challenge Duration */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-[3rem] p-12 text-white text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-3xl font-black italic uppercase mb-3">70-Day Challenge</h2>
                <p className="text-emerald-100 font-medium text-lg max-w-2xl mx-auto">
                    This is a 10-week fitness journey. Show up every day, log honestly, support your squad, and watch yourself transform.
                </p>
            </div>

            {/* Contact */}
            <div className="bg-zinc-50 rounded-[2rem] p-8 border border-zinc-200 text-center">
                <p className="text-sm text-zinc-600 font-medium">
                    Need help? Contact your admin or email{' '}
                    <a href="mailto:support@getfittogether.com" className="text-[#FF5E00] font-black hover:underline">
                        support@getfittogether.com
                    </a>
                </p>
            </div>
        </div>
    );
}

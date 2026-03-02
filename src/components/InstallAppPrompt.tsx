'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallAppPrompt() {
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isAppStandalone);

        if (isAppStandalone) return;

        // Check if user dismissed it previously
        const dismissed = localStorage.getItem('gft_install_dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
            return;
        }

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            setIsInstallable(true);
        }

        // Handle Android/Chrome PWA install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            alert('To install: Tap the Share button at the bottom of Safari, then select "Add to Home Screen".');
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('gft_install_dismissed', 'true');
    };

    if (isStandalone || isDismissed || !isInstallable) return null;

    return (
        <div className="mx-0 mt-6 md:mx-4 md:mt-6 mb-2 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl flex items-center justify-between relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4 z-10 w-[70%]">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                    <Download className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-xs md:text-sm uppercase tracking-wider mb-0.5">Install App</h3>
                    <p className="text-blue-100 text-[10px] md:text-xs font-medium leading-tight">Add to Home Screen for the best native experience.</p>
                </div>
            </div>

            <div className="flex flex-col gap-2 items-end z-10 shrink-0">
                <button onClick={handleDismiss} className="p-1 text-white/60 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                </button>
                <button
                    onClick={handleInstallClick}
                    className="bg-white text-blue-600 px-3 py-2 md:px-4 md:py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-50 transition-colors whitespace-nowrap press-effect"
                >
                    Install Now
                </button>
            </div>
        </div>
    );
}

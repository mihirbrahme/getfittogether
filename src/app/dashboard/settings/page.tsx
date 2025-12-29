'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Lock, LogOut, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Profile Data
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [totalPoints, setTotalPoints] = useState(0);
    const [createdAt, setCreatedAt] = useState('');

    // Password Change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth?mode=login');
            return;
        }

        setEmail(user.email || '');

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            setFullName(profile.full_name || '');
            setDisplayName(profile.display_name || '');
            setRole(profile.role || 'participant');
            setStatus(profile.status || 'pending');
            setTotalPoints(profile.total_points || 0);
            setCreatedAt(new Date(profile.created_at).toLocaleDateString());
        }

        setLoading(false);
    };

    const handleSaveProfile = async () => {
        if (!fullName.trim()) {
            alert('Full name is required');
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName.trim(),
                display_name: displayName.trim() || null
            })
            .eq('id', user.id);

        if (error) {
            alert('Error updating profile: ' + error.message);
        } else {
            alert('Profile updated successfully!');
        }
        setSaving(false);
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setChangingPassword(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            alert('Error changing password: ' + error.message);
        } else {
            alert('Password changed successfully!');
            setShowPasswordForm(false);
            setNewPassword('');
            setConfirmPassword('');
        }
        setChangingPassword(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth?mode=login');
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5E00]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">
                        Account <span className="text-[#FF5E00]">Settings</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Manage your profile and preferences
                    </p>
                </div>
                <div className="h-12 w-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
                    <User className="h-6 w-6 text-zinc-400" />
                </div>
            </div>

            {/* Account Overview */}
            <div className="bg-gradient-to-br from-[#FF5E00] to-orange-600 rounded-[2.5rem] p-8 text-white">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="text-4xl font-black">{(displayName || fullName)[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black italic uppercase mb-1">{displayName || fullName}</h2>
                        <p className="text-orange-100 text-sm font-medium">{email}</p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase">
                                {role}
                            </span>
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase">
                                {status}
                            </span>
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
                                {totalPoints} PTS
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 mb-6 flex items-center gap-3">
                    <User className="h-6 w-6 text-[#FF5E00]" />
                    Profile Information
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                            Display Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                            placeholder="How you want to be called"
                        />
                        <p className="text-xs text-zinc-400 mt-2 font-medium">
                            This will be shown in the dashboard and leaderboard
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                            Email Address
                        </label>
                        <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-zinc-200 bg-zinc-50">
                            <Mail className="h-5 w-5 text-zinc-400" />
                            <span className="font-medium text-zinc-600">{email}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2 font-medium">
                            Contact admin to change your email address
                        </p>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full bg-[#FF5E00] text-white font-black py-4 rounded-xl text-sm uppercase tracking-tight hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 mb-6 flex items-center gap-3">
                    <Lock className="h-6 w-6 text-[#FF5E00]" />
                    Security
                </h3>

                {!showPasswordForm ? (
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full px-6 py-4 rounded-xl border-2 border-zinc-200 font-black uppercase text-sm text-zinc-700 hover:border-[#FF5E00] hover:text-[#FF5E00] transition-colors flex items-center justify-center gap-2"
                    >
                        <Lock className="h-5 w-5" />
                        Change Password
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium pr-12"
                                    placeholder="Enter new password (min 6 characters)"
                                    minLength={6}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleChangePassword}
                                disabled={changingPassword || !newPassword || !confirmPassword}
                                className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl text-sm uppercase hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {changingPassword ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Update Password'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-8 bg-zinc-100 text-zinc-600 font-black py-4 rounded-xl text-sm uppercase hover:bg-zinc-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-[#FF5E00]" />
                    Account Details
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500 font-medium">Member Since</span>
                        <span className="font-black text-zinc-900">{createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500 font-medium">Account Status</span>
                        <span className={cn(
                            "font-black uppercase text-xs px-3 py-1 rounded-full",
                            status === 'approved' ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                        )}>
                            {status}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500 font-medium">Role</span>
                        <span className="font-black text-zinc-900 uppercase">{role}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-zinc-500 font-medium">Total Points Earned</span>
                        <span className="font-black text-[#FF5E00] text-xl">{totalPoints}</span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-[2.5rem] p-8 border-2 border-red-100 shadow-sm">
                <h3 className="text-lg font-black italic uppercase text-red-600 mb-4">
                    Danger Zone
                </h3>
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white font-black py-4 rounded-xl text-sm uppercase tracking-tight hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

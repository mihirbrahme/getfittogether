'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Lock, LogOut, Save, Loader2, Eye, EyeOff, Moon, Sun, Monitor, Users, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Profile Data
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [totalPoints, setTotalPoints] = useState(0);
    const [createdAt, setCreatedAt] = useState('');

    // Password Change
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Squad Management
    const [currentSquad, setCurrentSquad] = useState<{ id: string; name: string } | null>(null);
    const [allSquads, setAllSquads] = useState<{ id: string; name: string; code: string }[]>([]);
    const [selectedNewSquad, setSelectedNewSquad] = useState('');
    const [squadRequestPending, setSquadRequestPending] = useState(false);
    const [changingSquad, setChangingSquad] = useState(false);

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
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setRole(profile.role || 'participant');
            setStatus(profile.status || 'pending');
            setTotalPoints(profile.total_points || 0);
            setCreatedAt(new Date(profile.created_at).toLocaleDateString());
        }

        // Fetch current squad
        const { data: membership } = await supabase
            .from('group_members')
            .select('group_id, status, groups(id, name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (membership) {
            setCurrentSquad((membership as any).groups);
            if (membership.status === 'pending') {
                setSquadRequestPending(true);
            }
        }

        // Fetch all available squads
        const { data: squads } = await supabase
            .from('groups')
            .select('id, name, code')
            .order('name');

        if (squads) {
            setAllSquads(squads);
        }

        setLoading(false);
    };

    const handleSaveProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            alert('First and last name are required');
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`,
                display_name: firstName.trim()
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

    const handleSquadChange = async () => {
        if (!selectedNewSquad || selectedNewSquad === currentSquad?.id) {
            return;
        }

        setChangingSquad(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Insert new squad membership request (status: pending)
        const { error } = await supabase
            .from('group_members')
            .insert({
                user_id: user.id,
                group_id: selectedNewSquad,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                alert('You already have a pending request for this squad.');
            } else {
                alert('Error requesting squad change: ' + error.message);
            }
        } else {
            alert('Squad change request submitted! Awaiting admin approval.');
            setSquadRequestPending(true);
            setSelectedNewSquad('');
        }
        setChangingSquad(false);
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
                        <span className="text-[#FF5E00]">Settings</span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Manage your profile
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
                        <span className="text-4xl font-black">{firstName[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black italic uppercase mb-1">{firstName} {lastName}</h2>
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

            {/* Theme Settings */}
            <div className="premium-card rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                    {resolvedTheme === 'dark' ? <Moon className="h-6 w-6 text-[#FF5E00]" /> : <Sun className="h-6 w-6 text-[#FF5E00]" />}
                    Appearance
                </h3>

                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setTheme('light')}
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all press-effect",
                            theme === 'light'
                                ? "border-[#FF5E00] bg-orange-50 dark:bg-orange-500/10"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            theme === 'light' ? "bg-[#FF5E00] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        )}>
                            <Sun className="h-6 w-6" />
                        </div>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-wider",
                            theme === 'light' ? "text-[#FF5E00]" : "text-zinc-500 dark:text-zinc-400"
                        )}>Light</span>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all press-effect",
                            theme === 'dark'
                                ? "border-[#FF5E00] bg-orange-50 dark:bg-orange-500/10"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            theme === 'dark' ? "bg-[#FF5E00] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        )}>
                            <Moon className="h-6 w-6" />
                        </div>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-wider",
                            theme === 'dark' ? "text-[#FF5E00]" : "text-zinc-500 dark:text-zinc-400"
                        )}>Dark</span>
                    </button>

                    <button
                        onClick={() => setTheme('system')}
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all press-effect",
                            theme === 'system'
                                ? "border-[#FF5E00] bg-orange-50 dark:bg-orange-500/10"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            theme === 'system' ? "bg-[#FF5E00] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        )}>
                            <Monitor className="h-6 w-6" />
                        </div>
                        <span className={cn(
                            "text-xs font-black uppercase tracking-wider",
                            theme === 'system' ? "text-[#FF5E00]" : "text-zinc-500 dark:text-zinc-400"
                        )}>System</span>
                    </button>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4 font-medium text-center">
                    Currently using {resolvedTheme} mode
                </p>
            </div>

            {/* Squad Management */}
            <div className="premium-card rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                    <Users className="h-6 w-6 text-[#FF5E00]" />
                    Squad
                </h3>

                {/* Current Squad */}
                <div className="mb-6">
                    <label className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-2 block">
                        Current Squad
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                        <div className="h-10 w-10 rounded-lg bg-[#FF5E00] flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-zinc-900 dark:text-zinc-100 uppercase">
                                {currentSquad?.name || 'Not assigned'}
                            </p>
                            {squadRequestPending && (
                                <p className="text-xs text-amber-600 font-bold">Change request pending approval</p>
                            )}
                        </div>
                        {currentSquad && (
                            <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full uppercase">
                                Active
                            </span>
                        )}
                    </div>
                </div>

                {/* Change Squad */}
                <div>
                    <label className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-2 block">
                        Request Squad Change
                    </label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <select
                                value={selectedNewSquad}
                                onChange={(e) => setSelectedNewSquad(e.target.value)}
                                disabled={squadRequestPending || changingSquad}
                                className={cn(
                                    "w-full px-5 py-4 rounded-xl border appearance-none font-bold uppercase text-sm",
                                    "focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10",
                                    "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
                                    squadRequestPending && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <option value="">Select a squad...</option>
                                {allSquads.filter(s => s.id !== currentSquad?.id).map(squad => (
                                    <option key={squad.id} value={squad.id}>
                                        {squad.name} (Code: {squad.code})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                        </div>
                        <button
                            onClick={handleSquadChange}
                            disabled={!selectedNewSquad || squadRequestPending || changingSquad}
                            className={cn(
                                "px-6 py-4 rounded-xl font-black uppercase text-sm flex items-center gap-2 transition-all press-effect",
                                selectedNewSquad && !squadRequestPending
                                    ? "bg-[#FF5E00] text-white hover:bg-orange-600"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {changingSquad ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Request
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                        Squad change requires admin approval. Your progress will transfer to the new squad.
                    </p>
                </div>
            </div>

            {/* Profile Information */}
            <div className="premium-card rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 mb-6 flex items-center gap-3">
                    <User className="h-6 w-6 text-[#FF5E00]" />
                    Profile
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                            First Name *
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                            placeholder="Your first name"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2 block">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-[#FF5E00] focus:ring-4 focus:ring-[#FF5E00]/10 font-medium"
                            placeholder="Your last name"
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
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="premium-card rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
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
                                {changingPassword ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Update'}
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
            <div className="premium-card rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black italic uppercase text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-[#FF5E00]" />
                    Account Details
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-700">
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Member Since</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">{createdAt}</span>
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
                    <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-700">
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Role</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100 uppercase">{role}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-zinc-500 font-medium">Total Points Earned</span>
                        <span className="font-black text-[#FF5E00] text-xl">{totalPoints}</span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="premium-card rounded-[2.5rem] p-8 border-2 border-red-200 dark:border-red-900">
                <h3 className="text-lg font-black italic uppercase text-red-600 mb-4">
                    Sign Out
                </h3>
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white font-black py-4 rounded-xl text-sm uppercase tracking-tight hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}

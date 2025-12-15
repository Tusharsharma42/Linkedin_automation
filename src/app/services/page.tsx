'use client';
import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    LayoutDashboard,
    Linkedin,
    CalendarClock,
    Settings,
    ChevronRight,
    Copy,
    Check,
    AlertCircle,
    Loader2,
    Send,
    Save,
    Clock,
    Hash,
    Type,
    UserCircle,
    LucideIcon
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDoc, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';

// --- Interfaces ---

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
    completed: boolean;
}

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
    helpText?: string;
}

interface StatusBadgeProps {
    status: 'ready' | 'pending' | 'error' | 'neutral' | string;
}



interface LinkedinConfig {
    name: string;
    profileUrl: string;
    accessToken: string;
    clientId: string;
    clientSecret: string;
    companyPageId: string;
}

interface Schedule {
    date: string;
    time: string;
    timezone: string;
    hashtags: string;
}

interface Steps {
    generated: boolean;
    connected: boolean;
    scheduled: boolean;
}

interface GenerateViewProps {
    steps: Steps;
    topic: string;
    setTopic: (topic: string) => void;
    loading: boolean;
    handleGenerate: () => void;
    generatedContent: string;
    charCount: number;
    copyToClipboard: () => void;
}

interface ConnectViewProps {
    steps: Steps;
    linkedinConfig: LinkedinConfig;
    setLinkedinConfig: (config: LinkedinConfig) => void;
    handleSaveLinkedin: () => void;
}

interface ScheduleViewProps {
    steps: Steps;
    generatedContent: string;
    schedule: Schedule;
    setSchedule: (schedule: Schedule) => void;
    handleSchedule: () => void;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// --- Components ---

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, completed }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            <span>{label}</span>
        </div>
        {completed && <Check size={16} className="text-emerald-500" />}
    </button>
);

const InputGroup: React.FC<InputGroupProps> = ({ label, children, helpText }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700">
            {label}
        </label>
        {children}
        {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
    </div>
);

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const styles: Record<string, string> = {
        ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        error: 'bg-red-100 text-red-700 border-red-200',
        neutral: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.neutral}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};



// --- Sub-Views (Moved outside to prevent re-renders) ---

const GenerateView: React.FC<GenerateViewProps> = ({
    steps,
    topic,
    setTopic,
    loading,
    handleGenerate,
    generatedContent,
    charCount,
    copyToClipboard
}) => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Content Studio</h2>
                <p className="text-slate-500">Generate professional content powered by AI</p>
            </div>
            <StatusBadge status={steps.generated ? 'ready' : 'neutral'} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <InputGroup label="Topic or Idea" helpText="Be specific about your target audience and key message">
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. The impact of AI on software engineering workflows..."
                            className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none text-slate-700 placeholder:text-slate-400"
                        />
                    </InputGroup>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Generate Draft
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-slate-500" />
                        Pro Tips
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                            Include specific metrics or data points in your prompt
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                            Mention the desired tone (e.g., "Controversial", "Educational")
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                            Ask for a specific structure (e.g., "Listicle", "Story")
                        </li>
                    </ul>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="font-medium text-slate-700">Preview</span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Type size={14} /> {charCount} chars
                        </span>
                        {generatedContent && (
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <Copy size={14} /> Copy
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[500px] p-6 relative">
                    {generatedContent ? (
                        <div className="prose prose-slate max-w-none">
                            <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                                {generatedContent}
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <LayoutDashboard size={48} className="mb-4 opacity-20" />
                            <p>Generated content will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const ConnectView: React.FC<ConnectViewProps> = ({ steps, linkedinConfig, setLinkedinConfig, handleSaveLinkedin }) => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Account Configuration</h2>
                <p className="text-slate-500">Manage your LinkedIn API credentials</p>
            </div>
            <StatusBadge status={steps.connected ? 'ready' : 'pending'} />
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <InputGroup label="Full Name">
                    <div className="relative">
                        <UserCircle className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={linkedinConfig.name}
                            onChange={(e) => setLinkedinConfig({ ...linkedinConfig, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                            placeholder="John Doe"
                        />
                    </div>
                </InputGroup>

                <InputGroup label="Profile URL">
                    <div className="relative">
                        <Linkedin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="url"
                            value={linkedinConfig.profileUrl}
                            onChange={(e) => setLinkedinConfig({ ...linkedinConfig, profileUrl: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>
                </InputGroup>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">API Credentials</h3>

                <InputGroup label="Access Token" helpText="Your permanent or temporary OAuth token">
                    <input
                        type="password"
                        value={linkedinConfig.accessToken}
                        onChange={(e) => setLinkedinConfig({ ...linkedinConfig, accessToken: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none font-mono text-sm"
                        placeholder="li_at_..."
                    />
                </InputGroup>

                <div className="grid md:grid-cols-2 gap-6">
                    <InputGroup label="Client ID">
                        <input
                            type="text"
                            value={linkedinConfig.clientId}
                            onChange={(e) => setLinkedinConfig({ ...linkedinConfig, clientId: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-mono text-sm"
                        />
                    </InputGroup>
                    <InputGroup label="Client Secret">
                        <input
                            type="password"
                            value={linkedinConfig.clientSecret}
                            onChange={(e) => setLinkedinConfig({ ...linkedinConfig, clientSecret: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-mono text-sm"
                        />
                    </InputGroup>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleSaveLinkedin}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                >
                    <Save size={18} />
                    Save Configuration
                </button>
            </div>
        </div>
    </div>
);

const ScheduleView: React.FC<ScheduleViewProps> = ({ steps, generatedContent, schedule, setSchedule, handleSchedule }) => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Publication Schedule</h2>
                <p className="text-slate-500">Automate your posting timeline</p>
            </div>
            <StatusBadge status={steps.scheduled ? 'ready' : 'pending'} />
        </div>

        {!generatedContent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div>
                    <h4 className="text-sm font-semibold text-amber-900">No Content Ready</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        Please generate content in the Studio tab before scheduling.
                    </p>
                </div>
            </div>
        )}

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <InputGroup label="Date">
                    <div className="relative">
                        <CalendarClock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="date"
                            value={schedule.date}
                            onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                        />
                    </div>
                </InputGroup>

                <InputGroup label="Time">
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                        />
                    </div>
                </InputGroup>
            </div>

            <InputGroup label="Timezone">
                <select
                    value={schedule.timezone}
                    onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
                >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="IST">IST (India Standard Time)</option>
                </select>
            </InputGroup>

            <InputGroup label="Additional Hashtags" helpText="Separate with spaces">
                <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={schedule.hashtags}
                        onChange={(e) => setSchedule({ ...schedule, hashtags: e.target.value })}
                        placeholder="#growth #tech"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                </div>
            </InputGroup>

            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleSchedule}
                    disabled={!generatedContent || !schedule.date || !schedule.time}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                    <Send size={18} />
                    Confirm Schedule
                </button>
            </div>
        </div>
    </div>
);

export default function ServicesPage() {
    const [activeView, setActiveView] = useState<'generate' | 'connect' | 'schedule'>('generate');
    const [loading, setLoading] = useState<boolean>(false);
    const [notification, setNotification] = useState<Notification | null>(null);

    // Data States
    const [topic, setTopic] = useState<string>('');
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [linkedinConfig, setLinkedinConfig] = useState<LinkedinConfig>({
        name: '',
        profileUrl: '',
        accessToken: '',
        clientId: '',
        clientSecret: '',
        companyPageId: ''
    });
    const [schedule, setSchedule] = useState<Schedule>({
        date: '',
        time: '',
        timezone: 'UTC',
        hashtags: ''
    });

    // Analytics/Meta
    const [charCount, setCharCount] = useState<number>(0);
    const [steps, setSteps] = useState<Steps>({
        generated: false,
        connected: false,
        scheduled: false
    });



    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

    // --- Effects ---
    useEffect(() => {
        setCharCount(generatedContent.length);
    }, [generatedContent]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // --- Actions ---
    const showNotify = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
    };



    const handleGenerate = async () => {
        if (!topic.trim()) return showNotify('error', 'Please enter a topic first');

        setLoading(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Write a professional LinkedIn post about "${topic}".
      Tone: Professional, insightful, and engaging.
      Structure: Hook, Value Proposition, Key Takeaways, Call to Action.
      Length: 150-250 words.
      Formatting: Use line breaks for readability. Add 3-5 relevant hashtags at the end.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            setGeneratedContent(text);
            setSteps(prev => ({ ...prev, generated: true }));



            showNotify('success', 'Content generated successfully');
        } catch (error) {
            console.error(error);
            showNotify('error', 'Failed to generate content');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLinkedin = async () => {
        if (!linkedinConfig.profileUrl) return showNotify('error', 'Profile URL is required');

        try {
            await addDoc(collection(db, 'linkedinDetails'), linkedinConfig);
            setSteps(prev => ({ ...prev, connected: true }));
            showNotify('success', 'LinkedIn configuration saved');
        } catch (error) {
            showNotify('error', 'Failed to save configuration');
        }
    };

    const handleSchedule = async () => {
        if (!generatedContent || !schedule.date || !schedule.time) {
            return showNotify('error', 'Missing content or schedule details');
        }

        try {
            const scheduledTime = new Date(`${schedule.date}T${schedule.time}`).toISOString();
            await addDoc(collection(db, "scheduledPosts"), {
                content: generatedContent,
                ...linkedinConfig,
                ...schedule,
                scheduledTime,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            setSteps(prev => ({ ...prev, scheduled: true }));
            showNotify('success', 'Post scheduled successfully');
        } catch (error) {
            showNotify('error', 'Failed to schedule post');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        showNotify('success', 'Copied to clipboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
            {/* Sidebar - Sticky Positioning to fix overlap */}
            <aside className="w-64 bg-white border-r border-slate-200 sticky top-0 h-screen z-10 hidden md:flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                            <LayoutDashboard size={18} />
                        </div>
                        Rialytics
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <SidebarItem
                        icon={Sparkles}
                        label="Content Studio"
                        active={activeView === 'generate'}
                        onClick={() => setActiveView('generate')}
                        completed={steps.generated}
                    />
                    <SidebarItem
                        icon={Linkedin}
                        label="Connect Account"
                        active={activeView === 'connect'}
                        onClick={() => setActiveView('connect')}
                        completed={steps.connected}
                    />
                    <SidebarItem
                        icon={CalendarClock}
                        label="Schedule"
                        active={activeView === 'schedule'}
                        onClick={() => setActiveView('schedule')}
                        completed={steps.scheduled}
                    />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                            JD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                            <p className="text-xs text-slate-500 truncate">Pro Plan</p>
                        </div>
                        <Settings size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between">
                <div className="font-bold text-lg flex items-center gap-2">
                    <LayoutDashboard size={20} /> Rialytics
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveView('generate')} className={`p-2 rounded ${activeView === 'generate' ? 'bg-slate-100' : ''}`}><Sparkles size={20} /></button>
                    <button onClick={() => setActiveView('connect')} className={`p-2 rounded ${activeView === 'connect' ? 'bg-slate-100' : ''}`}><Linkedin size={20} /></button>
                    <button onClick={() => setActiveView('schedule')} className={`p-2 rounded ${activeView === 'schedule' ? 'bg-slate-100' : ''}`}><CalendarClock size={20} /></button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 mt-14 md:mt-0 overflow-x-hidden">
                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-2 ${notification.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-medium">{notification.message}</span>
                    </div>
                )}

                {/* Breadcrumbs */}
                <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
                    <span>Dashboard</span>
                    <ChevronRight size={14} />
                    <span className="font-medium text-slate-900 capitalize">
                        {activeView === 'generate' ? 'Content Studio' : activeView === 'connect' ? 'Account' : 'Schedule'}
                    </span>
                </div>

                {activeView === 'generate' && (
                    <GenerateView
                        steps={steps}
                        topic={topic}
                        setTopic={setTopic}
                        loading={loading}
                        handleGenerate={handleGenerate}
                        generatedContent={generatedContent}
                        charCount={charCount}
                        copyToClipboard={copyToClipboard}
                    />
                )}

                {activeView === 'connect' && (
                    <ConnectView
                        steps={steps}
                        linkedinConfig={linkedinConfig}
                        setLinkedinConfig={setLinkedinConfig}
                        handleSaveLinkedin={handleSaveLinkedin}
                    />
                )}
                {activeView === 'schedule' && (
                    <ScheduleView
                        steps={steps}
                        generatedContent={generatedContent}
                        schedule={schedule}
                        setSchedule={setSchedule}
                        handleSchedule={handleSchedule}
                    />
                )}
            </main>
        </div>
    );
}

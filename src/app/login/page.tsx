'use client';
import Link from "next/link";
import { useState, FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { auth, provider } from "../../firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Mail, LayoutDashboard } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful");
            router.push("/services");
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = "Failed to log in. Please check your credentials.";
            if (err.code === "auth/invalid-credential") {
                errorMessage = "Invalid email or password.";
            } else if (err.code === "auth/user-not-found") {
                errorMessage = "No account found with this email.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
            console.log("Google Sign-In Success");
            router.push("/services");
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            setError("Google Sign-In failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white z-10">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-2xl mb-8">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <LayoutDashboard size={22} />
                            </div>
                            Rialytics
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-500">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleSignIn}
                                type="button"
                                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Branding */}
            <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-emerald-900 to-slate-900 opacity-90" />
                <div className="absolute inset-0 flex flex-col justify-center px-20 text-white z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 backdrop-blur-sm mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
                            New Feature: AI Content Studio
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                            Automate your professional presence with intelligent tools.
                        </h2>
                        <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                            Join thousands of professionals who use Rialytics to streamline their content workflow and grow their network.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-12 border-t border-white/10 pt-12">
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-sm text-slate-400">Active Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">1M+</div>
                            <div className="text-sm text-slate-400">Posts Generated</div>
                        </div>
                    </div>
                </div>

                {/* Decorative pattern */}
                <div className="absolute inset-0 z-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }}></div>
            </div>
        </div>
    );
}

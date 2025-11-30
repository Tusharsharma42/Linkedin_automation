'use client';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Eye, EyeOff, AlertCircle, User, Mail, Lock, LayoutDashboard, Check } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth, provider } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile, UserCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeToTerms?: string;
    submit?: string;
}

const SignupPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const usersCollectionRef = collection(db, 'users');

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            await addDoc(usersCollectionRef, {
                uid: user.uid,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                createdAt: new Date().toISOString()
            });

            console.log('Account created successfully');
            router.push('/services');

        } catch (error: any) {
            console.error("Signup Error:", error);
            let errorMessage = 'Failed to create account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak.';
            }
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Google Sign-In Success:", user);
            router.push('/services');
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setErrors({ submit: 'Google Sign-In failed. Please try again.' });
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white z-10">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-2xl mb-8">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <LayoutDashboard size={22} />
                            </div>
                            Rialytics
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Start automating your professional presence today.
                        </p>
                    </div>

                    {errors.submit && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{errors.submit}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">First name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 ${errors.firstName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="John"
                                    />
                                </div>
                                {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">Last name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 ${errors.lastName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Doe"
                                    />
                                </div>
                                {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="name@company.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`pl-10 pr-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`pl-10 block w-full rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="agreeToTerms"
                                    name="agreeToTerms"
                                    type="checkbox"
                                    checked={formData.agreeToTerms}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="agreeToTerms" className="font-medium text-slate-700">
                                    I agree to the <Link href="/terms-conditions" className="text-emerald-600 hover:text-emerald-500 hover:underline">Terms and Conditions</Link>
                                </label>
                                {errors.agreeToTerms && <p className="mt-1 text-xs text-red-600">{errors.agreeToTerms}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                "Create account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or sign up with</span>
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
                                Sign up with Google
                            </button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Branding */}
            <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
                <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-emerald-900 to-slate-900 opacity-90" />
                <div className="absolute inset-0 flex flex-col justify-center px-20 text-white z-10">
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">
                            Start your journey to automated professional growth.
                        </h2>
                        <ul className="space-y-4 text-lg text-slate-300">
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                AI-powered content generation
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                Smart scheduling & analytics
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                Seamless LinkedIn integration
                            </li>
                        </ul>
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
};

export default SignupPage;

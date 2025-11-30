import Link from "next/link";
import { Button } from "../components/ui/button";
import { BarChart3, ArrowRight, Calendar, Users, TrendingUp } from "lucide-react";

export default function HomePage() {
    return (
        <main className="flex-1 bg-white">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f0f9ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f9ff_1px,transparent_1px)] bg-[size:6rem_4rem]">
                    <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#dbeafe,transparent)]"></div>
                </div>

                <div className="container mx-auto px-6 md:px-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 max-w-2xl">
                            <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 mb-6">
                                <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                                Now with AI-powered content generation
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6 leading-tight">
                                Master Your <span className="text-teal-700">LinkedIn Strategy</span> with Automation
                            </h1>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                                The professional's choice for scheduling, analytics, and multi-account management. Save 10+ hours a week and grow your network on autopilot.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white text-lg px-8 py-6 h-auto shadow-xl shadow-teal-700/20">
                                        Start Automating Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/services">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 text-lg px-8 py-6 h-auto">
                                        View Features
                                    </Button>
                                </Link>
                            </div>
                            <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                                    ))}
                                </div>
                                <p>Trusted by 10,000+ professionals</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            <div className="relative rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-2 shadow-2xl shadow-slate-200/50">
                                <div className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                                    {/* Mock UI Header */}
                                    <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                        <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                    </div>
                                    {/* Mock UI Content */}
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                                <div className="h-3 w-24 bg-slate-100 rounded"></div>
                                            </div>
                                            <div className="h-8 w-24 bg-teal-600 rounded"></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-24 rounded-lg bg-white border border-slate-100 p-3 shadow-sm">
                                                    <div className="h-8 w-8 rounded bg-teal-50 mb-3"></div>
                                                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-40 rounded-lg bg-white border border-slate-100 p-4 shadow-sm">
                                            <div className="flex items-end gap-2 h-full pb-2">
                                                {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-teal-100 rounded-t" style={{ height: `${h}%` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce duration-[3000ms]">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Engagement Rate</p>
                                        <p className="text-lg font-bold text-slate-900">+124%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6 md:px-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl mb-4">
                            Enterprise-Grade LinkedIn Tools
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Everything you need to scale your personal brand and company pages efficiently.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                icon: Calendar,
                                title: "Smart Scheduling",
                                description:
                                    "Plan weeks of content in minutes. Our smart scheduler finds the best times to post for maximum reach.",
                            },
                            {
                                icon: Users,
                                title: "Multi-Account Support",
                                description:
                                    "Manage your personal profile and company pages from a single dashboard. Switch contexts instantly.",
                            },
                            {
                                icon: BarChart3,
                                title: "Deep Analytics",
                                description:
                                    "Track impressions, engagement, and follower growth. Export reports to prove your ROI.",
                            },
                        ].map((service, index) => (
                            <div
                                key={index}
                                className="group rounded-2xl bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-teal-500/20 hover:-translate-y-1"
                            >
                                <div className="mb-6 inline-flex rounded-xl bg-teal-50 p-4 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                    <service.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold text-slate-900">{service.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white border-y border-slate-100">
                <div className="container mx-auto px-6 md:px-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
                        {[
                            { label: "Active Users", value: "10k+" },
                            { label: "Posts Scheduled", value: "5M+" },
                            { label: "LinkedIn Accounts", value: "25k+" },
                            { label: "Hours Saved", value: "1M+" },
                        ].map((stat, i) => (
                            <div key={i} className="px-4">
                                <div className="text-4xl md:text-5xl font-bold text-teal-700 mb-2">{stat.value}</div>
                                <div className="text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 px-6 md:px-10 overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="container relative z-10 mx-auto text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl mb-6">
                        Ready to Scale Your LinkedIn Presence?
                    </h2>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                        Join thousands of professionals who are saving time and growing faster with Rialytics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/signup">
                            <Button
                                size="lg"
                                className="bg-teal-600 hover:bg-teal-500 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-teal-900/50 w-full sm:w-auto"
                            >
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-slate-700 text-white hover:bg-slate-800 hover:text-white text-lg px-8 py-6 h-auto bg-transparent w-full sm:w-auto"
                            >
                                Contact Sales
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

"use client";

import { Globe, Mail, Heart, Github, MessageSquare } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-800 bg-black/50 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Feedback Call to Action section */}
                    <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 text-center">
                        <div className="flex justify-center mb-3">
                            <div className="p-3 rounded-full bg-accent/10 border border-accent/20">
                                <MessageSquare className="text-accent" size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Help us improve Kanji Kaisen</h3>
                        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                            Spotted a bug? Have a cool feature idea? <br/>
                            Let us know on our feedback board!
                        </p>
                        <a
                            href="https://kanjikaisen.featurebase.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent("feedback_clicked", { source: "footer_card" })}
                            className="inline-flex items-center justify-center w-full px-6 py-3 bg-accent hover:bg-[#1eeeee] text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20"
                        >
                            Give Feedback
                        </a>
                    </div>

                    {/* Secondary Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4">
                        <a
                            href="https://github.com/mxggle/kanji-kaisen"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors duration-200"
                        >
                            <Github className="w-4 h-4" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <a
                            href="https://harrysui.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors duration-200"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">Personal Site</span>
                        </a>
                        <a
                            href="mailto:muggle6594@gmail.com"
                            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors duration-200"
                        >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">Contact</span>
                        </a>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center space-x-2 text-gray-600 pt-4">
                        <span className="text-xs italic">Crafted with</span>
                        <Heart className="w-3 h-3 text-rose-500/60 fill-rose-500/30" />
                        <span className="text-xs">by</span>
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">HARRY SUI</span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col items-center space-y-1 pt-2">
                        <div className="text-[10px] text-gray-700">
                            © {currentYear} Kanji Kaisen • Version 1.1.0
                        </div>
                        <div className="text-[10px] text-gray-800">
                            Built with Next.js • Powered by AI
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

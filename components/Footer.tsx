import { Globe, Mail, Heart, Github, MessageSquare } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-gray-800 bg-black/50 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Author Info */}
                    <div className="flex items-center space-x-2 text-gray-400">
                        <span className="text-sm">Created with</span>
                        <Heart className="w-4 h-4 text-accent fill-accent animate-pulse" />
                        <span className="text-sm">by</span>
                        <span className="text-foreground font-semibold">HARRY SUI</span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center space-x-6">
                        <a
                            href="https://kanjikaisen.featurebase.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-400 hover:text-accent transition-colors duration-200"
                            aria-label="Feedback & Bugs"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm">Feedback</span>
                        </a>
                        <a
                            href="https://github.com/mxggle/kanji-kaisen"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-400 hover:text-accent transition-colors duration-200"
                            aria-label="GitHub Repository"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <a
                            href="https://harrysui.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-400 hover:text-accent transition-colors duration-200"
                            aria-label="Personal Website"
                        >
                            <Globe className="w-5 h-5" />
                            <span className="text-sm">Website</span>
                        </a>
                        <a
                            href="mailto:muggle6594@gmail.com"
                            className="flex items-center space-x-2 text-gray-400 hover:text-accent transition-colors duration-200"
                            aria-label="Contact Email"
                        >
                            <Mail className="w-5 h-5" />
                            <span className="text-sm">Contact</span>
                        </a>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs text-gray-500">
                        © {currentYear} Kanji Kaisen. All rights reserved.
                    </div>

                    {/* Tech Stack Badge */}
                    <div className="text-xs text-gray-600">
                        Built with Next.js • Powered by AI
                    </div>
                </div>
            </div>
        </footer>
    );
}

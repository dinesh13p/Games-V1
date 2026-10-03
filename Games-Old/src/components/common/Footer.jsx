import React from 'react'

const Footer = () => {
    return (
        <footer className="border-t border-gray-800 bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center space-x-4">
                        <span>© {new Date().getFullYear()} GamesV1</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Built by Dinesh Poudel</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a
                            href="https://www.dinesh-poudel.com.np"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            Portfolio
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-white transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
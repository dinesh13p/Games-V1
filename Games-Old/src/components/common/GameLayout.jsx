import React from 'react'
import Header from './Header'
import Footer from './Footer'

const GameLayout = ({ children, title, className = '' }) => {
    return (
        <div className="min-h-screen bg-gray-900">
            <Header />
            <main className={`flex items-center justify-center p-4 md:p-6 ${className}`}>
                <div className="w-full max-w-6xl">
                    {title && (
                        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
                            {title}
                        </h1>
                    )}
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default GameLayout
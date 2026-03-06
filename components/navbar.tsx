'use client'
import React from "react";
import Image from "next/image"
import { useRouter } from "next/navigation";


export const Navbar: React.FC = () => {
    const router = useRouter();
    return (
        <nav >
            <header className="hero-header">
                
                <div className="flex items-center hero-logo hover:cursor-pointer">
                    <Image src="/nobglogo2.png" alt="GreenSteps Logo" width={100} height={100} />
                </div>
                <div className="flex gap-4">
                <button className="hero-btn-ghost" onClick={() => router.push('/register')}>
                    Sign up
                </button>
                <button className="hero-btn-ghost" onClick={() => router.push('/login')}>
                    login
                </button>
                </div>
            </header>
        </nav>
    );
};

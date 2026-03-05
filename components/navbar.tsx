'use client'
import React from "react";
import Image from "next/image"
import { useRouter } from "next/navigation";


export const Navbar: React.FC = () => {
const router = useRouter();
    return (
        <nav className="w-full bg-white border-b border-gray-200 px-2 py-1 flex items-center justify-between">
            {/* Logo on far left */}
            <div className="flex items-center hover:cursor-pointer">
                <Image src="/nobglogo2.png" alt="GreenSteps Logo" width={110} height={110} />
            </div>

            {/* Buttons on far right */}
            <div className="flex items-center gap-6">
                <button className="btn btn-ghost" 
                onClick={() => router.push('/login')}
                >Login</button>
                <button className="btn btn-ghost"
                onClick={() => router.push('/register')}
                >Signup</button>
            </div>
        </nav>
    );
};

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const FloatingItem = ({
    children,
    initialX,
    initialY,
    duration,
    delay
}: {
    children: React.ReactNode;
    initialX: number;
    initialY: number;
    duration: number;
    delay: number;
}) => {
    return (
        <motion.div
            className="absolute text-neon-purple/20 pointer-events-none"
            initial={{ x: initialX, y: initialY, opacity: 0 }}
            animate={{
                y: [initialY, initialY - 50, initialY],
                rotate: [0, 10, -10, 0],
                opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
            }}
        >
            {children}
        </motion.div>
    );
};

const FunnyRotatingObject = () => {
    return (
        <motion.div
            className="fixed bottom-10 right-10 z-0 opacity-30 pointer-events-none text-neon-magenta"
            animate={{
                rotate: 360,
            }}
            transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {/* Kettlebell with a face */}
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Handle */}
                <path d="M30 30 C30 10, 70 10, 70 30" />
                {/* Body */}
                <circle cx="50" cy="60" r="30" fill="currentColor" fillOpacity="0.1" />
                {/* Eyes */}
                <circle cx="40" cy="55" r="3" fill="currentColor" />
                <circle cx="60" cy="55" r="3" fill="currentColor" />
                {/* Smile */}
                <path d="M40 65 Q50 75 60 65" strokeLinecap="round" />
                {/* Sweat drop */}
                <path d="M65 45 Q68 40 65 35" strokeWidth="1" />
            </svg>
        </motion.div>
    );
};

export default function FloatingBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Generate random positions for background items
    const items = [
        // Dumbbell
        <svg key="db1" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h12v2H6V5zm0 12h12v2H6v-2zm-4-9h2v8H2V8zm18 0h2v8h-2V8zM7 8h10v8H7V8z" /></svg>,
        // Kettlebell
        <svg key="kb1" width="50" height="50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.76 0-5 2.24-5 5v1H5v14h14V8h-2V7c0-2.76-2.24-5-5-5zm0 2c1.65 0 3 1.35 3 3v1H9V7c0-1.65 1.35-3 3-3z" /></svg>,
        // Plate
        <svg key="pl1" width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="3" /></svg>,
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {items.map((item, i) => (
                <FloatingItem
                    key={i}
                    initialX={Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)}
                    initialY={Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)}
                    duration={10 + Math.random() * 10}
                    delay={Math.random() * 5}
                >
                    {item}
                </FloatingItem>
            ))}
            <FunnyRotatingObject />
        </div>
    );
}

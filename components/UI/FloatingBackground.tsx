"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ThreeDKettlebell from "./ThreeDKettlebell";

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
            <div className="fixed bottom-0 right-0 z-0 pointer-events-none opacity-80">
                <ThreeDKettlebell />
            </div>
        </div>
    );
}

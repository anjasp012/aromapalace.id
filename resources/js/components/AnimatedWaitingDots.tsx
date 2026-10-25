import React, { useState, useEffect } from 'react';

interface AnimatedWaitingDotsProps {
    text?: string;
    className?: string;
}

export default function AnimatedWaitingDots({
    text = 'Menunggu',
    className = '',
}: AnimatedWaitingDotsProps) {
    const [dots, setDots] = useState('.');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <span className={`inline-flex items-baseline ${className}`}>
            <span>{text}</span>
            <span className="font-mono w-[18px] text-left inline-block">{dots}</span>
        </span>
    );
}

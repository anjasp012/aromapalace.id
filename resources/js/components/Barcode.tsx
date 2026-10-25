import React, { useMemo } from 'react';

// Code 128 11-bit binary patterns (107 patterns, stop pattern is 13 bits)
const PATTERNS: string[] = [
    '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
    '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
    '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
    '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
    '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
    '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
    '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
    '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
    '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
    '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
    '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
    '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
    '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
    '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
    '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
    '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
    '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
    '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
    '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
    '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
    '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
    '11010011100', '1100011101011'
];

interface BarcodeProps {
    value: string;
    height?: number;
    className?: string;
    showText?: boolean;
    quietZone?: number;
}

export default function Barcode({
    value,
    height = 56,
    className = 'w-full max-w-[320px] h-auto',
    showText = false,
    quietZone = 10,
}: BarcodeProps) {
    const rawValue = (value || '').trim();

    const barcodeData = useMemo(() => {
        if (!rawValue || rawValue.toLowerCase().includes('menunggu')) {
            return null;
        }

        // Check if value is pure numeric and has even length for Code 128C
        // Code 128C encodes 2 digits per symbol (50% less width, 2x thicker bars)
        const isAllDigits = /^\d+$/.test(rawValue);
        const useCodeC = isAllDigits && rawValue.length % 2 === 0;

        const codes: number[] = [];
        let checksum = 0;
        let weight = 1;

        if (useCodeC) {
            // Start Code C = 105
            codes.push(105);
            checksum = 105;
            for (let i = 0; i < rawValue.length; i += 2) {
                const pair = parseInt(rawValue.substring(i, i + 2), 10);
                codes.push(pair);
                checksum += pair * weight;
                weight++;
            }
        } else {
            // Start Code B = 104
            codes.push(104);
            checksum = 104;
            for (let i = 0; i < rawValue.length; i++) {
                const charCode = rawValue.charCodeAt(i);
                const code = charCode >= 32 && charCode <= 127 ? charCode - 32 : 0;
                codes.push(code);
                checksum += code * weight;
                weight++;
            }
        }

        codes.push(checksum % 103);
        codes.push(106); // Stop Code

        // Build binary string from patterns
        let binary = '';
        for (const code of codes) {
            binary += PATTERNS[code] || '11011001100';
        }

        // Run-length encoding: merge consecutive '1' bits into solid bars
        // This eliminates sub-pixel anti-aliasing gaps and rendering blur
        const bars: { x: number; width: number }[] = [];
        let currentRun = 0;
        const len = binary.length;

        for (let i = 0; i < len; i++) {
            if (binary[i] === '1') {
                currentRun++;
            } else {
                if (currentRun > 0) {
                    bars.push({
                        x: quietZone + i - currentRun,
                        width: currentRun,
                    });
                    currentRun = 0;
                }
            }
        }
        if (currentRun > 0) {
            bars.push({
                x: quietZone + len - currentRun,
                width: currentRun,
            });
        }

        const totalWidth = len + quietZone * 2;

        return {
            totalWidth,
            bars,
        };
    }, [rawValue, quietZone]);

    if (!barcodeData) {
        return (
            <div className="flex flex-col items-center justify-center p-3 text-center border border-dashed border-zinc-300 rounded bg-zinc-50">
                <span className="text-xs font-mono font-bold text-zinc-500">
                    [ RESI BELUM TERBIT ]
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                    Barcode akan otomatis tersedia setelah resi resmi aktif
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center select-none bg-white p-1">
            <svg
                viewBox={`0 0 ${barcodeData.totalWidth} ${height}`}
                className={className}
                preserveAspectRatio="none"
                shapeRendering="crispEdges"
                style={{ imageRendering: 'pixelated' }}
            >
                {/* 100% Pure white background to guarantee maximum contrast across quiet zones */}
                <rect
                    x={0}
                    y={0}
                    width={barcodeData.totalWidth}
                    height={height}
                    fill="#ffffff"
                />

                {/* Crisp black solid barcode bars */}
                {barcodeData.bars.map((bar, idx) => (
                    <rect
                        key={idx}
                        x={bar.x}
                        y={0}
                        width={bar.width}
                        height={height}
                        fill="#000000"
                    />
                ))}
            </svg>

            {showText && (
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest mt-1 text-black">
                    {rawValue}
                </span>
            )}
        </div>
    );
}

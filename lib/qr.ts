// Minimal QR code encoder: byte mode (UTF-8), error correction level M,
// versions 1–40, automatic mask. Enough for share links; no dependencies.
// Follows ISO/IEC 18004 and the structure of Project Nayuki's reference
// implementation (MIT). Pure, so the Node test runner can load it.

export interface QrCode {
    version: number;
    /** Modules per side (without the quiet zone). */
    size: number;
    mask: number;
    /** modules[y][x], true = dark. */
    modules: boolean[][];
}

export interface QrOptions {
    /** Force a mask pattern 0–7 (tests); by default the lowest-penalty mask is used. */
    mask?: number;
    minVersion?: number;
    maxVersion?: number;
}

// Level M tables, indexed by version (index 0 unused).
const ECC_CODEWORDS_PER_BLOCK = [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28,
];
const ECC_BLOCKS = [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38,
    40, 43, 45, 47, 49,
];
// Format bits for level M (L = 1, M = 0, Q = 3, H = 2).
const ECC_FORMAT_BITS = 0;

const getBit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

/** Data + EC modules in a symbol of this version (everything but function patterns). */
function rawDataModules(version: number): number {
    let result = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const numAlign = Math.floor(version / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (version >= 7) result -= 36;
    }
    return result;
}

/** Data codewords (bytes) available at level M. */
export function dataCodewords(version: number): number {
    return Math.floor(rawDataModules(version) / 8) - ECC_CODEWORDS_PER_BLOCK[version] * ECC_BLOCKS[version];
}

const charCountBits = (version: number) => (version <= 9 ? 8 : 16);

/** Largest UTF-8 payload (bytes) that fits a version at level M in byte mode. */
export function byteCapacity(version: number): number {
    return Math.floor((dataCodewords(version) * 8 - 4 - charCountBits(version)) / 8);
}

// GF(2^8) arithmetic with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1.
function gfMultiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}

export function reedSolomonDivisor(degree: number): number[] {
    const result: number[] = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] = gfMultiply(result[j], root);
            if (j + 1 < result.length) result[j] ^= result[j + 1];
        }
        root = gfMultiply(root, 0x02);
    }
    return result;
}

export function reedSolomonRemainder(data: readonly number[], divisor: readonly number[]): number[] {
    const result: number[] = divisor.map(() => 0);
    for (const b of data) {
        const factor = b ^ (result.shift() as number);
        result.push(0);
        divisor.forEach((coef, i) => {
            result[i] ^= gfMultiply(coef, factor);
        });
    }
    return result;
}

/** Splits data into blocks, appends EC codewords and interleaves them. */
function addEccAndInterleave(data: number[], version: number): number[] {
    const numBlocks = ECC_BLOCKS[version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[version];
    const rawCodewords = Math.floor(rawDataModules(version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const divisor = reedSolomonDivisor(blockEccLen);

    const blocks: number[][] = [];
    for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
        k += dat.length;
        const ecc = reedSolomonRemainder(dat, divisor);
        if (i < numShortBlocks) dat.push(0);
        blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
        blocks.forEach((block, j) => {
            // Skip the padding byte of short blocks.
            if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
        });
    }
    return result;
}

function alignmentPositions(version: number, size: number): number[] {
    if (version === 1) return [];
    const numAlign = Math.floor(version / 7) + 2;
    const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    const result = [6];
    for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
}

function maskApplies(mask: number, x: number, y: number): boolean {
    switch (mask) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
        case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
        default: return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0;
    }
}

class QrSymbol {
    readonly version: number;
    readonly size: number;
    readonly modules: boolean[][];
    readonly isFunction: boolean[][];

    constructor(version: number) {
        this.version = version;
        this.size = version * 4 + 17;
        this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
        this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
        this.drawFunctionPatterns();
    }

    private set(x: number, y: number, dark: boolean) {
        this.modules[y][x] = dark;
        this.isFunction[y][x] = true;
    }

    private drawFunctionPatterns() {
        const { size } = this;
        for (let i = 0; i < size; i++) {
            this.set(6, i, i % 2 === 0);
            this.set(i, 6, i % 2 === 0);
        }
        this.drawFinder(3, 3);
        this.drawFinder(size - 4, 3);
        this.drawFinder(3, size - 4);

        const positions = alignmentPositions(this.version, size);
        const n = positions.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Skip the three corners that hold finder patterns.
                if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
                this.drawAlignment(positions[i], positions[j]);
            }
        }
        this.drawFormatBits(0); // Reserves the area; redrawn once the mask is known.
        this.drawVersion();
    }

    private drawFinder(x: number, y: number) {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const xx = x + dx;
                const yy = y + dy;
                if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.set(xx, yy, dist !== 2 && dist !== 4);
            }
        }
    }

    private drawAlignment(x: number, y: number) {
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
    }

    drawFormatBits(mask: number) {
        const data = (ECC_FORMAT_BITS << 3) | mask;
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const bits = ((data << 10) | rem) ^ 0x5412;
        const { size } = this;

        // Around the top-left finder.
        for (let i = 0; i <= 5; i++) this.set(8, i, getBit(bits, i));
        this.set(8, 7, getBit(bits, 6));
        this.set(8, 8, getBit(bits, 7));
        this.set(7, 8, getBit(bits, 8));
        for (let i = 9; i < 15; i++) this.set(14 - i, 8, getBit(bits, i));

        // Split between the other two finders.
        for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, getBit(bits, i));
        for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, getBit(bits, i));
        this.set(8, size - 8, true); // The dark module.
    }

    private drawVersion() {
        if (this.version < 7) return;
        let rem = this.version;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        const bits = (this.version << 12) | rem;
        for (let i = 0; i < 18; i++) {
            const dark = getBit(bits, i);
            const a = this.size - 11 + (i % 3);
            const b = Math.floor(i / 3);
            this.set(a, b, dark);
            this.set(b, a, dark);
        }
    }

    drawCodewords(data: readonly number[]) {
        const { size } = this;
        let i = 0;
        // Two-module columns, right to left, zigzagging up and down; column 6 is the timing pattern.
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    const upward = ((right + 1) & 2) === 0;
                    const y = upward ? size - 1 - vert : vert;
                    if (!this.isFunction[y][x] && i < data.length * 8) {
                        this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
                        i++;
                    }
                }
            }
        }
    }

    /** XORs the mask onto data modules (applying it twice undoes it). */
    applyMask(mask: number) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (!this.isFunction[y][x] && maskApplies(mask, x, y)) this.modules[y][x] = !this.modules[y][x];
            }
        }
    }

    penalty(): number {
        const { size, modules } = this;
        let result = 0;
        const line = (get: (i: number) => boolean) => {
            let runColor = false;
            let run = 0;
            const history = [0, 0, 0, 0, 0, 0, 0];
            const addHistory = (length: number) => {
                if (history[0] === 0) length += size; // Light border before the first run.
                history.pop();
                history.unshift(length);
            };
            const countPatterns = () => {
                const n = history[1];
                const core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
                return (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) + (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0);
            };
            for (let i = 0; i < size; i++) {
                if (get(i) === runColor) {
                    run++;
                    if (run === 5) result += 3;
                    else if (run > 5) result++;
                } else {
                    addHistory(run);
                    if (!runColor) result += countPatterns() * 40;
                    runColor = get(i);
                    run = 1;
                }
            }
            if (runColor) {
                addHistory(run);
                run = 0;
            }
            addHistory(run + size);
            result += countPatterns() * 40;
        };
        for (let y = 0; y < size; y++) line((x) => modules[y][x]);
        for (let x = 0; x < size; x++) line((y) => modules[y][x]);

        for (let y = 0; y < size - 1; y++) {
            for (let x = 0; x < size - 1; x++) {
                const c = modules[y][x];
                if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3;
            }
        }

        let dark = 0;
        for (const row of modules) for (const m of row) if (m) dark++;
        const total = size * size;
        const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
        return result + k * 10;
    }
}

/** Encodes `text` (UTF-8, byte mode, level M). Returns null when it doesn't fit version 40 (or `maxVersion`). */
export function encodeQr(text: string, options: QrOptions = {}): QrCode | null {
    const bytes = Array.from(new TextEncoder().encode(text));
    const minVersion = Math.max(1, options.minVersion ?? 1);
    const maxVersion = Math.min(40, options.maxVersion ?? 40);

    let version = minVersion;
    while (version <= maxVersion && bytes.length > byteCapacity(version)) version++;
    if (version > maxVersion) return null;

    // Mode indicator, character count, data, terminator, byte padding.
    const bits: number[] = [];
    const append = (value: number, length: number) => {
        for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    };
    append(0b0100, 4);
    append(bytes.length, charCountBits(version));
    for (const b of bytes) append(b, 8);
    const capacityBits = dataCodewords(version) * 8;
    append(0, Math.min(4, capacityBits - bits.length));
    append(0, (8 - (bits.length % 8)) % 8);

    const data: number[] = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
    for (let pad = 0xec; data.length < dataCodewords(version); pad ^= 0xec ^ 0x11) data.push(pad);

    const symbol = new QrSymbol(version);
    symbol.drawCodewords(addEccAndInterleave(data, version));

    let mask = options.mask ?? -1;
    if (mask < 0 || mask > 7) {
        let best = Infinity;
        for (let m = 0; m < 8; m++) {
            symbol.applyMask(m);
            symbol.drawFormatBits(m);
            const score = symbol.penalty();
            if (score < best) {
                best = score;
                mask = m;
            }
            symbol.applyMask(m);
        }
    }
    symbol.applyMask(mask);
    symbol.drawFormatBits(mask);

    return { version, size: symbol.size, mask, modules: symbol.modules };
}

/** SVG path data for the dark modules (one rect per horizontal run), offset by a quiet zone of `border` modules. */
export function qrPath(qr: QrCode, border = 4): string {
    const parts: string[] = [];
    qr.modules.forEach((row, y) => {
        let x = 0;
        while (x < qr.size) {
            if (!row[x]) {
                x++;
                continue;
            }
            const start = x;
            while (x < qr.size && row[x]) x++;
            parts.push(`M${start + border} ${y + border}h${x - start}v1h-${x - start}z`);
        }
    });
    return parts.join("");
}

/**
 * Chunk large Promise.all executions.
 * @date 2/14/2024 - 11:59:34 PM
 *
 * @export
 * @async
 * @template T
 * @param {Promise<T>[]} promises
 * @param {number} [chunkSize=10000]
 * @returns {Promise<T[]>}
 */
export declare function promiseAllChunked<T>(promises: Promise<T>[], chunkSize?: number): Promise<T[]>;
export declare function removeLastSlash(str: string): string;
/**
 * Parse the requested byte range from the header.
 *
 * @export
 * @param {string} range
 * @param {number} totalLength
 * @returns {({ start: number; end: number } | null)}
 */
export declare function parseByteRange(range: string, totalLength: number): {
    start: number;
    end: number;
} | null;
/**
 * Return the platforms config path.
 *
 * @export
 * @returns {string}
 */
export declare function platformConfigPath(): string;
export declare function tempDiskPath(): string;
export declare function sanitizeFileName(fileName: string): string;
export declare function fastStringHash(input: string): string;
export declare function pathToTempDiskFileId(path: string, username?: string): string;
export declare function isValidDate(date: string): boolean;

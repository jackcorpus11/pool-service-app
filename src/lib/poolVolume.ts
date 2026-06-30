export type PoolShape = "rectangle" | "oval" | "round";

export function calculateGallons(
    shape: PoolShape,
    length: number,
    width: number,
    avgDepth: number
): number {
    if (length <= 0 || width <= 0 || avgDepth <= 0) return 0;

    const multiplier = shape === "rectangle" ? 7.5 : 5.9;
    return Math.round(length * width * avgDepth * multiplier);

}
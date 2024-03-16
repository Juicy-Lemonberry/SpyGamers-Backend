export default function lerp(min: number, max: number, fraction: number): number {
    return (max - min) * fraction + min;
}
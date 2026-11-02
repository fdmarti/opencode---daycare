export interface SkeletonProps {
  /** Tailwind classes with the size and shape of the placeholder. */
  className?: string;
  /** Renders a circle instead of a rounded rectangle. */
  circle?: boolean;
}

/**
 * Placeholder shown while real data is loading. It never shows text, so no
 * mock data can leak through while the session is being resolved.
 */
export function Skeleton({ className = "", circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse bg-separador",
        circle ? "rounded-full" : "rounded-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

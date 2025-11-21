import Link from "next/link";

export default function SpotNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-app p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          <span className="text-glow-magenta">Spot Not Found</span>
        </h1>
        <p className="text-text-secondary mb-6">
          The workout spot you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-neon rounded-xl font-bold text-white hover:scale-105 transition-transform"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

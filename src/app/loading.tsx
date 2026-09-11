export default function Loading() {
  return (
    <div className="container-x grid gap-6 py-16 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-video w-full animate-shimmer bg-[linear-gradient(90deg,#eef2fb_25%,#dde6f7_50%,#eef2fb_75%)] bg-[length:200%_100%]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 rounded bg-ink-100" />
            <div className="h-4 w-full rounded bg-ink-100" />
            <div className="h-4 w-2/3 rounded bg-ink-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LocaleLoading() {
  return (
    <div role="status" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-48 animate-pulse rounded-full bg-fog" />
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="grid gap-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-fog" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-fog" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-fog" />
          </div>
        ))}
      </div>
    </div>
  );
}

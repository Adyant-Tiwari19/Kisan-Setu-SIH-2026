export const CropCardSkeleton = () => (
  <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse">
    <div className="h-40 w-full rounded-xl bg-slate-200" />
    <div className="h-5 w-2/3 rounded-md bg-slate-200" />
    <div className="flex items-center justify-between pt-2">
      <div className="h-4 w-1/3 rounded-md bg-slate-200" />
      <div className="h-4 w-1/4 rounded-md bg-slate-200" />
    </div>
    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
      <div className="h-6 w-1/4 rounded-md bg-slate-200" />
      <div className="h-8 w-1/3 rounded-lg bg-slate-200" />
    </div>
  </div>
)

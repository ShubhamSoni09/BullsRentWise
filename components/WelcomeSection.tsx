'use client';

export default function WelcomeSection() {
  const highlights = [
    {
      title: 'City complaint history',
      description: 'Spot recent heat, leak, pest, and housing issues near the address.',
      tone: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-100',
    },
    {
      title: 'Safety and weather context',
      description: 'Balance crime, humidity, and precipitation signals before touring.',
      tone: 'bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 border-teal-100',
    },
    {
      title: 'Rental decision tools',
      description: 'Compare budgets, roommates, commute, amenities, photos, and AI notes.',
      tone: 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-100',
    },
  ];

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-lg shadow-slate-950/[0.05] sm:p-5">
      <div className="mb-4">
        <p className="section-label">What you get</p>
        <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">A rental report built for quick decisions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use it before a tour, while comparing saved places, or when deciding with roommates.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
        {highlights.map((item, index) => (
          <div key={item.title} className={`rounded-2xl border p-3 sm:p-4 ${item.tone}`}>
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">
              {index + 1}
            </div>
            <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-teal-900 p-3 text-white sm:mt-5 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black text-white">
            BR
          </div>
          <p className="text-sm leading-5 text-white/90">
            Tip: save every place you check so your recommendation panel can compare them later.
          </p>
        </div>
      </div>
    </div>
  );
}


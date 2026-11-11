import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChefHat,
  ChevronRight,
  Clock3,
  Flame,
  Heart,
  Home,
  Leaf,
  ListFilter,
  MapPin,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import "./_group.css";

type Recipe = {
  title: string;
  subtitle: string;
  image: string;
  time: string;
  tag: string;
  category: string;
  description: string;
};

const recipes: Recipe[] = [
  {
    title: "Mahshi",
    subtitle: "Grape leaves, slow-cooked with love",
    image: "/__mockup/images/food-hub/mahshi.jpg",
    time: "1 hr 20 min",
    tag: "Family favourite",
    category: "Comfort",
    description: "Tender grape leaves wrapped around a fragrant rice and herb filling, simmered gently until every roll is soft and bright with lemon.",
  },
  {
    title: "Molokhia with chicken",
    subtitle: "A silky green classic, the home way",
    image: "/__mockup/images/food-hub/molokhia.jpg",
    time: "55 min",
    tag: "From Cairo",
    category: "Comfort",
    description: "A deeply comforting bowl of molokhia with tender chicken and warm rice—the kind of Sunday lunch that brings everyone to the table.",
  },
  {
    title: "Koshari",
    subtitle: "Lentils, pasta & crisp onions",
    image: "/__mockup/images/food-hub/koshari.jpg",
    time: "45 min",
    tag: "Street-food icon",
    category: "Quick",
    description: "Egypt's beloved mix of rice, lentils and pasta, finished with spiced tomato sauce, chickpeas and a generous crown of crispy onions.",
  },
];

const categories = ["All", "Comfort", "Quick", "Vegetarian"];

const shortcutCopy: Record<string, { title: string; body: string }> = {
  "Fridge chef": {
    title: "Cook with what you have",
    body: "Choose a few ingredients from your fridge and discover Egyptian dishes that make them shine.",
  },
  "Meal planner": {
    title: "A calmer week, one meal at a time",
    body: "Sketch out a week of family meals and keep your favourite recipes close. Planner actions are a preview in this concept.",
  },
  "Learn from a home cook": {
    title: "Learn the little things",
    body: "Explore hands-on cooking sessions led by home cooks, from rolling mahshi to getting molokhia just right.",
  },
};

function IconButton({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return <button aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} className={className}>{children}</button>;
}

export function PhotoFirstHome() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState<string[]>([]);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [shortcut, setShortcut] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Home");
  const [notice, setNotice] = useState("");

  const visibleRecipes = useMemo(() => recipes.filter((recipe) => {
    const matchesSearch = `${recipe.title} ${recipe.subtitle} ${recipe.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || recipe.category === category || (category === "Vegetarian" && recipe.title === "Mahshi");
    return matchesSearch && matchesCategory;
  }), [query, category]);

  const toggleSave = (title: string) => {
    setSaved((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
    setNotice(saved.includes(title) ? "Removed from your saved recipes" : "Saved for later");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "Home") {
      setNotice(`${tab} is shown as a preview destination`);
      window.setTimeout(() => setNotice(""), 2000);
    }
  };

  return (
    <main className="fh-home relative mx-auto flex h-[100dvh] min-h-[680px] w-full max-w-[430px] flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top_right,rgba(231,239,226,.9),transparent_72%)]" />
      <header className="relative z-10 shrink-0 px-5 pt-3">
        <div className="mb-4 flex h-5 items-center justify-between px-1 text-[11px] font-bold tracking-[.02em] text-[#304337]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-[10px] items-end gap-[2px]"><i className="h-1 w-[2px] rounded bg-current" /><i className="h-1.5 w-[2px] rounded bg-current" /><i className="h-2 w-[2px] rounded bg-current" /><i className="h-[10px] w-[2px] rounded bg-current" /></span>
            <span className="h-[9px] w-[15px] rounded-[3px] border border-[#304337] p-[1.5px]"><span className="block h-full w-[72%] rounded-[1px] bg-[#304337]" /></span>
          </div>
        </div>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#285c43] text-[#f8f1df] shadow-[0_5px_12px_rgba(40,92,67,.16)]">
              <Utensils size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-['Manrope'] text-[19px] font-extrabold leading-[1.05] tracking-[-.8px] text-[#234a36]">food hub</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#859082]">A taste of home</p>
            </div>
          </div>
          <button onClick={() => setShortcut("Learn from a home cook")} className="flex h-10 items-center gap-2 rounded-full border border-[#e5e7d9] bg-[#fffdf7]/90 px-3 text-left">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f2dfc8] text-[10px] font-extrabold text-[#754b32]">SA</span>
            <span className="text-[11px] font-bold text-[#304337]">Hi, Salma</span>
          </button>
        </div>
        <h1 className="font-['Manrope'] text-[27px] font-extrabold leading-[1.12] tracking-[-1.2px] text-[#26392d]">What feels like home<br />today<span className="text-[#d77a4a]">?</span></h1>
        <label className="mt-4 flex h-11 items-center gap-2.5 rounded-[15px] border border-[#e7e5d9] bg-[#fffdf7] px-3.5 shadow-[0_3px_9px_rgba(53,65,48,.035)]">
          <Search size={17} className="shrink-0 text-[#7f8e7c]" />
          <input
            aria-label="Search recipes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dishes, ingredients..."
            className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#26392d] outline-none placeholder:text-[#9b9f93]"
          />
          <IconButton label="Clear search" onClick={() => setQuery("")} className={`grid h-7 w-7 place-items-center rounded-full text-[#7c887c] ${query ? "" : "hidden"}`}><X size={14} /></IconButton>
          {!query && <ListFilter size={16} className="text-[#687a69]" />}
        </label>
      </header>

      <div className="fh-scroll relative z-[1] min-h-0 flex-1 overflow-y-auto pb-3">
        <section className="px-5 pt-[18px]">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#a17b59]">Made for your table</p>
              <h2 className="mt-0.5 font-['Manrope'] text-[18px] font-extrabold tracking-[-.6px] text-[#26392d]">Recipes to come home to</h2>
            </div>
            <button onClick={() => { setCategory("All"); setQuery(""); }} className="flex items-center gap-1 text-[10px] font-bold text-[#39664c]">See all <ArrowRight size={13} /></button>
          </div>
          <div className="fh-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3.5 py-[7px] text-[10px] font-bold transition-colors ${category === item ? "bg-[#285c43] text-[#fffdf7]" : "border border-[#e5e7db] bg-[#fffdf7] text-[#657264]"}`}>{item}</button>
            ))}
          </div>
          {visibleRecipes.length > 0 ? (
            <div className="fh-scroll -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
              {visibleRecipes.map((recipe, index) => (
                <article key={recipe.title} className="fh-recipe-card fh-fade-up w-[280px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-[#e9e7db] bg-[#fffdf7] shadow-[0_6px_16px_rgba(48,64,47,.07)]" style={{ animationDelay: `${index * 70}ms` }}>
                  <div onClick={() => setActiveRecipe(recipe)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setActiveRecipe(recipe); }} role="button" tabIndex={0} className="relative block h-[145px] w-full cursor-pointer overflow-hidden text-left">
                    <img src={recipe.image} alt={recipe.title} className="fh-recipe-photo h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-[#fffdf0]/95 px-2.5 py-1 text-[9px] font-extrabold text-[#39563e]">{recipe.tag}</span>
                    <IconButton label={saved.includes(recipe.title) ? `Unsave ${recipe.title}` : `Save ${recipe.title}`} onClick={() => toggleSave(recipe.title)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#fffdf0]/95 text-[#315b40]">
                      <Bookmark size={15} fill={saved.includes(recipe.title) ? "currentColor" : "none"} />
                    </IconButton>
                    <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#25392d]/85 px-2.5 py-1 text-[9px] font-semibold text-white"><Clock3 size={11} /> {recipe.time}</span>
                  </div>
                  <button onClick={() => setActiveRecipe(recipe)} className="flex w-full items-center justify-between px-3.5 py-3 text-left">
                    <span className="min-w-0">
                      <span className="block font-['Manrope'] text-[16px] font-extrabold leading-tight tracking-[-.45px] text-[#26392d]">{recipe.title}</span>
                      <span className="mt-1 block truncate text-[10px] font-medium text-[#7b8477]">{recipe.subtitle}</span>
                    </span>
                    <span className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf2e8] text-[#376247]"><ChevronRight size={16} /></span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#d9dfd2] bg-[#f5f4e9] px-5 py-7 text-center">
              <Leaf size={20} className="mx-auto text-[#5b795f]" />
              <p className="mt-2 text-[13px] font-bold text-[#33483a]">No dishes found just yet</p>
              <p className="mt-1 text-[10px] text-[#7c8678]">Try another search or browse all recipes.</p>
            </div>
          )}
        </section>

        <section className="px-5 pt-5">
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#a17b59]">Your kitchen, your way</p>
              <h2 className="mt-0.5 font-['Manrope'] text-[17px] font-extrabold tracking-[-.55px] text-[#26392d]">A little help for today</h2>
            </div>
            <Sparkles size={17} className="mb-1 text-[#cb8755]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Fridge chef", sub: "Use what you have", icon: <Flame size={17} />, tone: "bg-[#f5e8d7] text-[#98623c]" },
              { label: "Meal planner", sub: "Plan the week", icon: <Check size={17} />, tone: "bg-[#e8efe3] text-[#4d7453]" },
              { label: "Learn from a home cook", sub: "Cook side by side", icon: <ChefHat size={17} />, tone: "bg-[#f1e7e5] text-[#9b5c4b]" },
            ].map((item) => (
              <button key={item.label} onClick={() => setShortcut(item.label)} className="min-h-[94px] rounded-[16px] border border-[#ebe7dc] bg-[#fffdf7] p-2.5 text-left transition-transform active:scale-[.98]">
                <span className={`grid h-8 w-8 place-items-center rounded-[11px] ${item.tone}`}>{item.icon}</span>
                <span className="mt-2 block text-[10px] font-extrabold leading-[1.15] text-[#344538]">{item.label}</span>
                <span className="mt-1 block text-[8px] font-medium leading-tight text-[#8a9084]">{item.sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="px-5 pb-3 pt-5">
          <div className="relative overflow-hidden rounded-[19px] bg-[#285c43] px-4 py-3.5 text-[#fffdf3]">
            <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border border-white/10" />
            <div className="absolute -right-1 -top-1 h-16 w-16 rounded-full border border-white/10" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#d8e2d0]">From kitchens like yours</p>
                <p className="mt-1 font-['Manrope'] text-[15px] font-extrabold tracking-[-.4px]">Recipes carry a story.</p>
                <p className="mt-0.5 text-[10px] text-[#e3eadf]">Find the hands and memories behind every dish.</p>
              </div>
              <button onClick={() => setShortcut("Learn from a home cook")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4f0dd] text-[#285c43]" aria-label="Explore home cooks"><ArrowRight size={17} /></button>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-[9px] text-[#98988b]"><MapPin size={11} /> Made for Egyptian kitchens, wherever you call home</p>
        </section>
      </div>

      <nav className="relative z-10 shrink-0 border-t border-[#e6e5d9] bg-[#fffdf7]/95 px-2 pb-[max(9px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="flex items-center justify-around">
          {[
            { label: "Home", icon: <Home size={18} /> },
            { label: "Explore", icon: <Search size={18} /> },
            { label: "Cooks", icon: <ChefHat size={19} /> },
            { label: "Planner", icon: <Check size={18} /> },
            { label: "Profile", icon: <Heart size={18} /> },
          ].map((tab) => (
            <button key={tab.label} onClick={() => handleTab(tab.label)} className={`flex min-w-[54px] flex-col items-center gap-1 py-1 ${activeTab === tab.label ? "text-[#285c43]" : "text-[#9a9d90]"}`}>
              <span className={`grid h-7 w-10 place-items-center rounded-full ${activeTab === tab.label ? "bg-[#e8efe3]" : ""}`}>{tab.icon}</span>
              <span className={`text-[9px] ${activeTab === tab.label ? "font-extrabold" : "font-semibold"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {notice && <div className="absolute bottom-[78px] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#263f31] px-4 py-2 text-[11px] font-semibold text-white shadow-lg">{notice}</div>}

      {(activeRecipe || shortcut) && (
        <div className="fh-backdrop absolute inset-0 z-40 flex items-end bg-[#1d3025]/40" onClick={() => { setActiveRecipe(null); setShortcut(null); }}>
          <div role="dialog" aria-modal="true" aria-label={activeRecipe ? `${activeRecipe.title} recipe details` : shortcut ?? "Preview action"} className="fh-drawer max-h-[82%] w-full overflow-y-auto rounded-t-[27px] bg-[#fffdf7] px-5 pb-7 pt-3 shadow-[0_-10px_40px_rgba(29,48,37,.18)]" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[#dcded2]" />
            {activeRecipe ? (
              <>
                <div className="relative h-[180px] overflow-hidden rounded-[19px]">
                  <img src={activeRecipe.image} alt={activeRecipe.title} className="h-full w-full object-cover" />
                  <IconButton label="Close recipe details" onClick={() => setActiveRecipe(null)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#fffdf7]/95 text-[#304637]"><X size={16} /></IconButton>
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#a17b59]">{activeRecipe.tag}</p><h3 className="mt-1 font-['Manrope'] text-[24px] font-extrabold tracking-[-1px] text-[#26392d]">{activeRecipe.title}</h3></div>
                  <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-[#edf2e8] px-2.5 py-1.5 text-[10px] font-bold text-[#46674d]"><Clock3 size={12} /> {activeRecipe.time}</span>
                </div>
                <p className="mt-3 text-[12px] leading-[1.6] text-[#6e786d]">{activeRecipe.description}</p>
                <div className="mt-4 rounded-[15px] bg-[#f3f2e8] p-3.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#52664f]">A note from the kitchen</p>
                  <p className="mt-1.5 text-[11px] leading-[1.5] text-[#697367]">This recipe preview is a starting point. Full instructions and home-cook stories belong in the next build.</p>
                </div>
                <button onClick={() => toggleSave(activeRecipe.title)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#285c43] text-[12px] font-extrabold text-[#fffdf4]">{saved.includes(activeRecipe.title) ? <Check size={15} /> : <Bookmark size={15} />} {saved.includes(activeRecipe.title) ? "Saved to your recipes" : "Save this recipe"}</button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#e8efe3] text-[#39644a]"><Sparkles size={21} /></span><IconButton label="Close preview action" onClick={() => setShortcut(null)} className="grid h-9 w-9 place-items-center rounded-full bg-[#f0f0e7] text-[#627064]"><X size={17} /></IconButton></div>
                <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[.15em] text-[#a17b59]">Food Hub preview</p>
                <h3 className="mt-1 font-['Manrope'] text-[22px] font-extrabold leading-tight tracking-[-.8px] text-[#26392d]">{shortcutCopy[shortcut ?? ""]?.title}</h3>
                <p className="mt-2 text-[12px] leading-[1.6] text-[#6e786d]">{shortcutCopy[shortcut ?? ""]?.body}</p>
                <div className="mt-4 rounded-[15px] border border-[#e7e7db] bg-[#f8f6ed] p-3 text-[10px] leading-[1.5] text-[#7b8377]">This control previews a possible feature. It does not connect to a service or save anything outside this screen.</div>
                <button onClick={() => setShortcut(null)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#285c43] text-[12px] font-extrabold text-[#fffdf4]">Back to recipes <ArrowLeft size={15} /></button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

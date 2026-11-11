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
  CalendarDays,
  CircleCheck,
  CreditCard,
  Mic,
  Minus,
  Play,
  Plus,
  ShoppingBasket,
  Star,
  Wallet,
  Video,
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

type FoodHubScreen =
  | "Welcome" | "Explore" | "Recipe" | "CookMode" | "Planner" | "Cooks"
  | "CookProfile" | "Booking" | "LiveLesson" | "LessonComplete" | "Cart"
  | "Vouchers" | "Checkout" | "Confirmation" | "Courses" | "Profile"
  | "CookDashboard" | "Onboarding";

const screenCopy: Record<FoodHubScreen, { title: string; eyebrow: string; subtitle: string }> = {
  Welcome: { title: "Cook it. Learn it. Love it.", eyebrow: "A taste of home", subtitle: "Recipes, videos and real home cooks—together at last." },
  Explore: { title: "Find your next favourite", eyebrow: "Explore", subtitle: "Search the dishes you miss and the skills you want to learn." },
  Recipe: { title: "Mahshi warak enab", eyebrow: "Egyptian · family favourite", subtitle: "Grape leaves rolled around rice, herbs and a little patience." },
  CookMode: { title: "Mahshi, step by step", eyebrow: "Cook mode · step 5 of 6", subtitle: "Cover with stock, add a plate on top and simmer gently." },
  Planner: { title: "A week that tastes like home", eyebrow: "Your meal plan", subtitle: "A few good ideas, ready for the days ahead." },
  Cooks: { title: "Learn from a home cook", eyebrow: "Real kitchens, real know-how", subtitle: "Patient, personal lessons from cooks who know these dishes by heart." },
  CookProfile: { title: "Om Ahmed", eyebrow: "Home cook · Giza · Arabic", subtitle: "“I teach Egyptian home food the way my mother taught me.”" },
  Booking: { title: "Make time to learn", eyebrow: "Book a lesson with Om Ahmed", subtitle: "Choose how, when and what you’d like to cook together." },
  LiveLesson: { title: "Your lesson with Om Ahmed", eyebrow: "Online lesson · demo preview", subtitle: "A sample lesson screen. Video calling is not connected in this preview." },
  LessonComplete: { title: "How was your lesson?", eyebrow: "A note for Om Ahmed", subtitle: "Your honest review helps the next cook find the right teacher." },
  Cart: { title: "Your cart", eyebrow: "A little of everything", subtitle: "Your lesson, course, and ingredients in one place." },
  Vouchers: { title: "A little something saved", eyebrow: "Vouchers", subtitle: "Available offers for lessons, groceries and courses." },
  Checkout: { title: "Nearly around the table", eyebrow: "Checkout · demo preview", subtitle: "Check your delivery and payment choices. No payment will be taken." },
  Confirmation: { title: "You’re all set!", eyebrow: "Order preview", subtitle: "In the real app, your lesson and delivery details would be confirmed here." },
  Courses: { title: "Learn at your own pace", eyebrow: "Courses", subtitle: "Good lessons to return to, from cooks who know their craft." },
  Profile: { title: "Your Food Hub", eyebrow: "Mariam’s kitchen", subtitle: "Your recipes, courses and plans, all close at hand." },
  CookDashboard: { title: "Welcome, Om Ahmed", eyebrow: "Home cook studio · demo data", subtitle: "Your teaching week, lesson schedule and earnings overview." },
  Onboarding: { title: "Turn your cooking into income", eyebrow: "Become a home cook · step 3 of 6", subtitle: "Teach from your own kitchen, on your own hours." },
};

const meals = [
  { name: "Mahshi, ready for tomorrow", type: "Prep ahead", time: "80 min", image: "/__mockup/images/food-hub/mahshi.jpg" },
  { name: "Molokhia with chicken", type: "Lunch", time: "55 min", image: "/__mockup/images/food-hub/molokhia.jpg" },
  { name: "Koshari", type: "Dinner", time: "45 min", image: "/__mockup/images/food-hub/koshari.jpg" },
];

const dishCards = [
  { name: "Mahshi", detail: "Grape leaves · 80 min", image: "/__mockup/images/food-hub/mahshi.jpg", rating: "4.9", tag: "Family favourite" },
  { name: "Molokhia with chicken", detail: "A silky Egyptian classic · 55 min", image: "/__mockup/images/food-hub/molokhia.jpg", rating: "4.8", tag: "From Cairo" },
  { name: "Koshari", detail: "Lentils, rice & crispy onions · 45 min", image: "/__mockup/images/food-hub/koshari.jpg", rating: "4.9", tag: "Street-food icon" },
];

function ScreenButton({ children, onClick, secondary = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button onClick={onClick} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] px-4 text-[13px] font-extrabold transition active:scale-[.98] ${secondary ? "border border-[#e5e6d9] bg-[#fffdf7] text-[#315641]" : "bg-[#285c43] text-[#fffdf7] shadow-[0_5px_12px_rgba(40,92,67,.13)]"}`}>{children}</button>;
}

function DishCard({ name, detail, image, tag, rating, onClick }: { name: string; detail: string; image: string; tag: string; rating: string; onClick: () => void }) {
  return <button onClick={onClick} className="group w-full overflow-hidden rounded-[18px] border border-[#e7e6d9] bg-[#fffdf7] text-left shadow-[0_4px_12px_rgba(40,55,42,.045)]">
    <div className="relative h-[142px] overflow-hidden">
      <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" src={image} alt={name} />
      <span className="absolute left-3 top-3 rounded-full bg-[#fffdf1]/95 px-2.5 py-1 text-[9px] font-bold text-[#345c40]">{tag}</span>
      <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#fffdf1]/95 px-2.5 py-1 text-[10px] font-extrabold text-[#594729]"><Star size={11} fill="currentColor" /> {rating}</span>
    </div>
    <span className="block p-3.5"><span className="block text-[14px] font-extrabold text-[#26392d]">{name}</span><span className="mt-1 block text-[10px] text-[#7e867a]">{detail}</span></span>
  </button>;
}

function ProfileBadge() {
  return <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[3px] border-[#f2dfc8] bg-[#e9c3a0] font-['Manrope'] text-[16px] font-extrabold text-[#65462f]">OA</div>;
}

export function FoodHubPage({ screen }: { screen: FoodHubScreen }) {
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string[]>(["Chicken", "Rice", "Tomato", "Onion"]);
  const [picked, setPicked] = useState("Online video");
  const [chosen, setChosen] = useState("");
  const [count, setCount] = useState(1);
  const [rating, setRating] = useState(5);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [checked, setChecked] = useState<string[]>(["Grape leaves"]);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(5);
  const [tip, setTip] = useState("No tip");
  const [tab, setTab] = useState("All");
  const copy = screenCopy[screen];
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2100); };
  const toggleItem = (item: string) => setSelected((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const toggleCheck = (item: string) => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const page = (() => {
    switch (screen) {
      case "Welcome": return <div className="space-y-4">
        <div className="relative h-[250px] overflow-hidden rounded-[25px]"><img src="/__mockup/images/food-hub/molokhia.jpg" alt="Homemade Egyptian molokhia with chicken and rice" className="h-full w-full object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-[#172a1e]/75 via-transparent to-transparent" /><span className="absolute bottom-4 left-4 rounded-full bg-[#fffdf3]/95 px-3 py-1.5 text-[10px] font-bold text-[#315641]">Om Ahmed is teaching · 6 PM</span></div>
        <div className="rounded-2xl border border-[#e9e6d9] bg-[#fffdf7] p-4"><p className="text-[12px] leading-6 text-[#667365]">Every recipe, video and cooking class in one place—plus home cooks who teach you, step by step.</p><div className="mt-4 space-y-2"><ScreenButton onClick={() => notify("Apple sign-in is not connected in this preview.")}>Continue with Apple</ScreenButton><ScreenButton secondary onClick={() => notify("Phone sign-in is not connected in this preview.")}>Continue with phone number</ScreenButton></div></div>
        <ScreenButton secondary onClick={() => notify("Home-cook application preview")}>I want to teach & earn <ArrowRight size={15} /></ScreenButton><button onClick={() => notify("Arabic language preview")} className="w-full py-2 text-[11px] font-bold text-[#657668]">العربية · Switch language</button>
      </div>;
      case "Explore": return <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-[14px] border border-[#e5e6d9] bg-[#fffdf7] px-3"><Search size={16} className="text-[#829080]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes, cooks, videos…" className="h-11 min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></div>
        <div className="rounded-[18px] bg-[#21372a] p-4 text-[#fffdf3]"><div className="flex items-center justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#d5dfce]">AI fridge chef</p><p className="mt-1 text-[16px] font-extrabold">What’s in your fridge?</p></div><Sparkles size={19} /></div><p className="mt-1 text-[10px] text-[#d6dfd3]">Tap ingredients. Find dinner.</p><div className="mt-3 flex flex-wrap gap-2">{["Chicken","Rice","Tomato","Onion","Yogurt","Eggs","Garlic"].map((item) => <button key={item} onClick={() => toggleItem(item)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${selected.includes(item) ? "bg-[#e8eedf] text-[#315641]" : "border border-white/25 text-white"}`}>{selected.includes(item) && <Check size={10} className="mr-1 inline" />}{item}</button>)}</div><button onClick={() => notify(`${selected.length} ingredients matched to recipes`)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f1e7d4] py-2.5 text-[11px] font-extrabold text-[#315641]">Find my recipes <ArrowRight size={14} /></button></div>
        <div className="flex gap-2 overflow-x-auto">{["All","Videos","Recipes","Cooks","Courses"].map(item => <button onClick={() => setTab(item)} key={item} className={`shrink-0 rounded-full px-3.5 py-2 text-[10px] font-bold ${tab === item ? "bg-[#285c43] text-white" : "border border-[#e6e5da] bg-[#fffdf7] text-[#647364]"}`}>{item}</button>)}</div>
        <div className="space-y-3">{dishCards.filter(d => `${d.name} ${d.detail}`.toLowerCase().includes(query.toLowerCase())).map(dish => <DishCard key={dish.name} {...dish} onClick={() => notify(`${dish.name} recipe preview selected`)} />)}</div>
      </div>;
      case "Recipe": return <div className="space-y-4">
        <div className="relative h-[225px] overflow-hidden rounded-[22px]"><img src="/__mockup/images/food-hub/mahshi.jpg" alt="Egyptian grape-leaf mahshi" className="h-full w-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-12 text-[11px] font-bold text-white">Watch a 12-minute kitchen video <Play size={13} className="ml-1 inline" /></span></div>
        <div className="flex items-start justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#a17b59]">Egyptian · family favourite</p><h2 className="mt-1 text-[24px] font-extrabold tracking-[-.8px]">Mahshi warak enab</h2><p className="mt-1 text-[10px] text-[#747f72]">★ 4.8 · 1,240 reviews · by Om Ahmed</p></div><button aria-label="Save recipe" onClick={() => setSaved(!saved)} className="rounded-full bg-[#e9efe4] p-2.5 text-[#315c43]"><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button></div>
        <div className="grid grid-cols-3 gap-2">{[["Time","80 min"],["Calories","420 kcal"],["Level","Medium"]].map(([a,b]) => <div key={a} className="rounded-[14px] bg-[#f1f0e6] p-3"><p className="text-[9px] text-[#7c8478]">{a}</p><p className="mt-1 text-[12px] font-extrabold">{b}</p></div>)}</div>
        <div className="rounded-[18px] border border-[#e8e7dc] bg-[#fffdf7] p-4"><div className="flex items-center justify-between"><h3 className="text-[14px] font-extrabold">Ingredients</h3><div className="flex items-center gap-3"><button onClick={() => setCount(Math.max(1,count-1))}><Minus size={15}/></button><span className="text-[11px] font-bold">{count} people</span><button onClick={() => setCount(count+1)}><Plus size={15}/></button></div></div>{[["Grape leaves","125 g"],["Egyptian rice","250 g"],["Tomatoes","3 pcs"],["Dill, parsley, coriander","1 bunch"]].map(([a,b])=><div key={a} className="flex justify-between border-t border-[#eeece3] py-3 text-[11px]"><span>{a}</span><b>{b}</b></div>)}</div>
        <ScreenButton onClick={() => notify("Grocery partner options are a preview.")}><ShoppingBasket size={16}/> Order groceries</ScreenButton><ScreenButton secondary onClick={() => notify("Cook mode opened in preview.")}><Play size={15}/> Start cooking</ScreenButton>
        <button onClick={() => notify("12 home cooks offer a lesson for this dish.")} className="w-full rounded-[15px] bg-[#f3e8d7] p-3 text-left text-[11px] font-bold text-[#6b553d]">Learn it live with a mother <span className="mt-1 block text-[9px] font-medium">12 cooks teach this · Explore lessons</span></button>
      </div>;
      case "CookMode": return <div className="flex min-h-[650px] flex-col rounded-[25px] bg-[#17271e] p-5 text-[#fffdf4]">
        <div className="flex items-center justify-between"><span className="rounded-full bg-[#355341] px-3 py-1.5 text-[10px] font-extrabold">STEP {step} OF 6</span><button onClick={() => notify("Screen stays on during cook mode preview")} className="text-[10px] text-[#d2dfd1]">Screen stays on</button></div>
        <div className="my-6 h-[190px] overflow-hidden rounded-[19px]"><img src="/__mockup/images/food-hub/mahshi.jpg" alt="Mahshi grape leaves before simmering" className="h-full w-full object-cover" /></div>
        <h2 className="font-['Manrope'] text-[27px] font-extrabold leading-tight tracking-[-.8px]">Cover with stock, add a plate on top and simmer on low heat.</h2>
        <div className="mt-4 rounded-[17px] bg-[#263b2e] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#c5d6c4]">Step timer</p><p className="mt-1 text-[30px] font-extrabold">25:00</p><button onClick={() => setPlaying(!playing)} className="mt-2 rounded-full bg-[#dfe9d9] px-4 py-2 text-[10px] font-extrabold text-[#315641]">{playing ? "Pause timer" : "Start timer"}</button></div>
        <div className="mt-4 rounded-[14px] border border-white/10 p-3 text-[11px] text-[#d6dfd2]">500 ml stock</div>
        <div className="mt-auto flex items-center justify-between pt-5"><button onClick={() => setStep(Math.max(1,step-1))} className="grid h-11 w-11 place-items-center rounded-full bg-[#293d31]" aria-label="Previous step"><ArrowLeft size={16}/></button><button onClick={() => notify("Voice control listens only in the full app.")} className="flex items-center gap-2 text-[10px] text-[#d3dfd0]"><Mic size={14}/> Say “next”</button><button onClick={() => setStep(Math.min(6,step+1))} className="flex items-center gap-2 rounded-full bg-[#e7ebdc] px-5 py-3 text-[11px] font-extrabold text-[#243c2e]">Next <ArrowRight size={14}/></button></div>
      </div>;
      case "Planner": return <div className="space-y-4">
        <div className="flex items-center justify-between rounded-[18px] bg-[#eaf0e4] p-4"><div><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#597359]">Week of 8–14 November</p><p className="mt-1 text-[15px] font-extrabold">Made for your table</p></div><button onClick={() => notify("Meal planning preview")} className="flex items-center gap-1 text-[10px] font-bold text-[#315641]"><Sparkles size={13}/> Auto-plan</button></div>
        <div className="flex gap-2 overflow-x-auto">{["S 8","M 9","T 10","W 11","T 12","F 13","S 14"].map((d,i)=><button key={d+i} onClick={() => setChosen(d)} className={`grid h-12 min-w-10 place-items-center rounded-[14px] text-[10px] font-bold ${chosen===d || (!chosen && i===3) ? "bg-[#285c43] text-white" : "bg-[#fffdf7] text-[#526254]"}`}>{d}</button>)}</div>
        {meals.map((meal) => <div key={meal.name} className="flex gap-3 rounded-[17px] border border-[#e7e6da] bg-[#fffdf7] p-3"><img src={meal.image} alt={meal.name} className="h-[68px] w-[78px] rounded-[12px] object-cover"/><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#a17b59]">{meal.type}</p><p className="mt-1 text-[12px] font-extrabold">{meal.name}</p><p className="mt-1 text-[9px] text-[#7f897c]">{meal.time}</p></div><button onClick={() => notify(`${meal.name} options`)} className="self-center text-[#748474]"><Plus size={16}/></button></div>)}
        <div className="rounded-[18px] bg-[#f3f0e3] p-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-[14px] font-extrabold">Grocery list</h3><span className="text-[9px] text-[#758073]">{checked.length} of 4 checked</span></div>{["Grape leaves · 250 g","Egyptian rice · 1 kg","Chicken thighs · 1 kg","Fresh molokhia · 500 g"].map(item=><button key={item} onClick={()=>toggleCheck(item)} className="flex w-full items-center gap-2 border-t border-[#dfdfd1] py-2.5 text-left text-[10px]"><span className={`grid h-4 w-4 place-items-center rounded border ${checked.includes(item)?"border-[#447251] bg-[#447251] text-white":"border-[#bdc3b6]"}`}>{checked.includes(item)&&<Check size={10}/>}</span><span className={checked.includes(item)?"text-[#90978a] line-through":""}>{item}</span></button>)}</div>
        <ScreenButton onClick={() => notify("Grocery delivery is a preview; no store is connected.")}>Deliver groceries · partner preview</ScreenButton>
      </div>;
      case "Cooks": return <div className="space-y-4">
        <div className="flex gap-2">{["Online video","Home visit"].map(item=><button key={item} onClick={()=>setPicked(item)} className={`flex-1 rounded-[14px] border p-3 text-[11px] font-bold ${picked===item?"border-[#397552] bg-[#e8f0e5] text-[#315641]":"border-[#e7e5da] bg-[#fffdf7] text-[#667365]"}`}>{item}</button>)}</div>
        <div className="flex gap-2 overflow-x-auto">{["Any dish","Today","Women only","4.5★+"].map(item=><button key={item} onClick={()=>setTab(item)} className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-bold ${tab===item?"bg-[#e7efe3] text-[#315641]":"border border-[#e5e5da] bg-[#fffdf7] text-[#697769]"}`}>{item}</button>)}</div>
        {["Om Ahmed","Hanan","Samira"].map((name,i)=><button key={name} onClick={()=>notify(`${name} cook profile selected`)} className="w-full rounded-[18px] border border-[#e6e5d9] bg-[#fffdf7] p-4 text-left"><div className="flex items-center gap-3"><ProfileBadge/><div className="min-w-0 flex-1"><div className="flex justify-between"><span className="text-[14px] font-extrabold">{name}</span><span className="text-[11px] font-extrabold text-[#846647]">{["EGP 280","EGP 240","EGP 300"][i]}<small className="font-medium">/hr</small></span></div><p className="mt-1 text-[10px] text-[#717d71]">★ {["4.9 · 320 lessons · Giza","4.8 · 140 lessons · Alexandria","4.7 · 95 lessons · Maadi"][i]}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{(i===0?["Mahshi","Molokhia","Fattah"]:i===1?["Seafood","Sayadeya"]:["Koshary","Hawawshi"]).map(tag=><span key={tag} className="rounded-full bg-[#f1f0e6] px-2.5 py-1 text-[9px] font-bold text-[#657161]">{tag}</span>)}</div><div className="mt-3 flex items-center justify-between text-[9px] text-[#788177]"><span>Arabic · Verified cook profile</span><span className="font-bold text-[#38664a]">Next: Today 6 PM →</span></div></button>)}
      </div>;
      case "CookProfile": return <div className="space-y-4">
        <div className="rounded-[20px] bg-[#e8efe4] p-4"><div className="flex items-center gap-3"><ProfileBadge/><div><p className="text-[16px] font-extrabold">Om Ahmed</p><p className="text-[10px] text-[#657566]">Home cook · Giza · Arabic</p></div></div><div className="mt-4 grid grid-cols-3 gap-2">{[["4.9★","612 reviews"],["320","lessons"],["78%","book again"]].map(([a,b])=><div key={a} className="rounded-[12px] bg-[#fffdf7] p-2.5 text-center"><p className="text-[14px] font-extrabold">{a}</p><p className="text-[8px] text-[#748074]">{b}</p></div>)}</div></div>
        <div className="flex flex-wrap gap-2">{["ID verified","Kitchen hygiene checked","Trial lesson passed"].map(a=><span key={a} className="flex items-center gap-1 rounded-full bg-[#e6f0e5] px-2.5 py-1.5 text-[9px] font-bold text-[#39694a]"><CircleCheck size={12}/>{a}</span>)}</div>
        <p className="rounded-[17px] border border-[#e8e5d9] bg-[#fffdf7] p-4 text-[12px] leading-6 text-[#626e62]">Mother of three, cooking for 30 years. I teach Egyptian home food the way my mother taught me, slowly and step by step.</p>
        <h3 className="text-[14px] font-extrabold">Signature dishes</h3><div className="grid grid-cols-3 gap-2">{dishCards.map(d=><button onClick={()=>notify(`${d.name} lesson selected`)} key={d.name} className="overflow-hidden rounded-[14px] bg-[#fffdf7] text-left"><img src={d.image} alt={d.name} className="h-[82px] w-full object-cover"/><span className="block truncate p-2 text-[9px] font-bold">{d.name}</span></button>)}</div>
        <div className="rounded-[17px] bg-[#fffdf7] p-4"><p className="text-[11px] font-bold">Salma · ★★★★★ · 2 days ago</p><p className="mt-1 text-[10px] leading-5 text-[#697568]">“She was so patient. My mahshi finally rolled tight!”</p></div>
        <ScreenButton onClick={()=>notify("Choose your lesson time in booking preview")}>From EGP 280 / hr · Book a lesson</ScreenButton>
      </div>;
      case "Booking": return <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">{["Online video","Home visit"].map(item=><button key={item} onClick={()=>setPicked(item)} className={`rounded-[16px] border p-3 text-left ${picked===item?"border-2 border-[#397552] bg-[#e8f0e5]":"border-[#e4e4d8] bg-[#fffdf7]"}`}><span className="text-[12px] font-extrabold">{item}</span><span className="mt-1 block text-[9px] leading-4 text-[#778176]">{item==="Online video"?"Cook along from anywhere":"She comes to your kitchen"}</span></button>)}</div>
        <label className="block text-[10px] font-extrabold">Dish<select className="mt-2 h-11 w-full rounded-[13px] border border-[#e7e5da] bg-[#fffdf7] px-3 text-[11px] font-semibold"><option>Mahshi warak enab</option><option>Molokhia</option><option>Egyptian fattah</option></select></label>
        <div><div className="flex justify-between"><h3 className="text-[14px] font-extrabold">November</h3><span className="text-[9px] text-[#758075]">Riyadh time (GMT+3)</span></div><div className="mt-3 flex gap-2 overflow-auto">{["Thu 12","Fri 13","Sat 14","Sun 15","Mon 16","Tue 17"].map(d=><button onClick={()=>setChosen(d)} key={d} className={`min-w-[54px] rounded-[13px] py-2.5 text-[10px] font-bold ${chosen===d?"bg-[#183328] text-white":"bg-[#fffdf7]"}`}>{d}</button>)}</div></div>
        <div className="grid grid-cols-4 gap-2">{["10 AM","12 PM","2 PM","4 PM","6 PM","7 PM","8 PM","9 PM"].map(t=><button key={t} onClick={()=>setChosen(t)} className={`rounded-[12px] border py-2.5 text-[10px] font-bold ${chosen===t?"border-[#397552] bg-[#e7f0e5] text-[#315641]":"border-[#e5e4d8] bg-[#fffdf7]"}`}>{t}</button>)}</div>
        <button onClick={()=>setSaved(!saved)} className={`flex w-full items-center gap-3 rounded-[15px] p-3 text-left ${saved?"bg-[#e6efe2]":"bg-[#f5ecd7]"}`}><span className={`grid h-5 w-5 place-items-center rounded border ${saved?"border-[#397552] bg-[#397552] text-white":"border-[#bdc3ae]"}`}>{saved&&<Check size={12}/>}</span><span><b className="block text-[10px]">Make it a 5-lesson package</b><small className="text-[9px] text-[#778075]">Save 15% · use within 2 months</small></span></button>
        <ScreenButton onClick={()=>notify("Booking is a preview; no lesson is reserved.")}>Add to cart & continue <ArrowRight size={14}/></ScreenButton>
        <p className="text-center text-[9px] text-[#7c8579]">Free cancellation up to 6 hours before · Terms shown before payment</p>
      </div>;
      case "LiveLesson": return <div className="space-y-4">
        <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-[23px] bg-[#233b2c] p-5 text-center text-white"><div className="absolute left-3 top-3 rounded-full bg-[#e8ece0] px-2.5 py-1.5 text-[9px] font-extrabold text-[#315641]">DEMO · 23:14</div><div><span className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-full bg-[#f1d9c3] text-[18px] font-extrabold text-[#63462f]">OA</span><p className="mt-3 text-[13px] font-extrabold">Om Ahmed’s camera</p><p className="mt-1 text-[9px] text-[#d2dfd3]">Camera feed unavailable in this preview</p></div><span className="absolute bottom-4 right-4 grid h-[50px] w-[50px] place-items-center rounded-[12px] bg-[#445b49] text-[9px]">You</span></div>
        <div className="rounded-[17px] bg-[#fffdf7] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#738170]">Step 3 of 6 · Mahshi · Synced from recipe</p><p className="mt-2 text-[17px] font-extrabold leading-6">Fold the sides in, then roll tightly away from you.</p><p className="mt-2 text-[11px] italic text-[#8a6948]">“Not too much rice, habibti — one small spoon.”</p></div>
        <div className="flex gap-2"><ScreenButton secondary onClick={()=>notify("Repeat step preview")}>Show me again</ScreenButton><ScreenButton secondary onClick={()=>notify("Camera controls are not available here")}>Zoom on hands</ScreenButton></div>
        <ScreenButton onClick={()=>notify("Lesson controls are demo-only; no call is running.")}><Video size={15}/> Lesson controls · demo only</ScreenButton>
      </div>;
      case "LessonComplete": return <div className="space-y-4 text-center">
        <div className="mx-auto grid h-[74px] w-[74px] place-items-center rounded-full bg-[#e5f0e4] text-[#39714e]"><Check size={31}/></div><div><p className="text-[10px] font-bold text-[#728071]">LESSON COMPLETE · 58 MIN</p><h2 className="mt-2 text-[18px] font-extrabold">How was your lesson with Om Ahmed?</h2></div>
        <div className="flex justify-center gap-1.5">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setRating(n)} aria-label={`${n} stars`} className="p-1 text-[#d49145]"><Star size={24} fill={n<=rating?"currentColor":"none"}/></button>)}</div>
        <div className="flex flex-wrap justify-center gap-2">{["Very patient","Clear steps","Tasty result","On time","Great tips"].map(i=><button key={i} onClick={()=>setChosen(chosen===i?"":i)} className={`rounded-full px-3 py-2 text-[9px] font-bold ${chosen===i?"bg-[#315f44] text-white":"bg-[#f0f0e6] text-[#667264]"}`}>{i}</button>)}</div>
        <button onClick={()=>notify("Photo sharing is not connected in this preview.")} className="w-full rounded-[16px] border border-[#eee6d9] bg-[#fffdf7] p-3 text-left"><b className="block text-[11px]">Show off your dish</b><small className="text-[9px] text-[#7a8478]">Your photo could appear on her profile</small></button>
        <div className="rounded-[17px] bg-[#f4f1e3] p-4"><p className="text-[12px] font-extrabold">Add a tip for Om Ahmed</p><p className="mt-1 text-[9px] text-[#798276]">Tips go directly to the cook.</p><div className="mt-3 flex gap-2">{["No tip","EGP 10","EGP 20","Other"].map(t=><button key={t} onClick={()=>setTip(t)} className={`flex-1 rounded-[11px] py-2.5 text-[9px] font-bold ${tip===t?"bg-[#315f44] text-white":"bg-[#fffdf7] text-[#667264]"}`}>{t}</button>)}</div></div>
        <ScreenButton onClick={()=>notify(`Review preview saved · ${rating} stars · ${tip}`)}>Submit review</ScreenButton><ScreenButton secondary onClick={()=>notify("Choose another lesson in booking preview")}>Book her again</ScreenButton>
      </div>;
      case "Cart": return <div className="space-y-4">
        <div className="rounded-[17px] bg-[#e9f0e4] p-3 text-[10px] font-bold text-[#315641]">LESSONS & COURSES · 2 items</div>
        {[["Mahshi lesson with Om Ahmed","Online · Thu 12 Nov · 6 PM · 1 hr","EGP 280"],["Ramadan table course","20 videos · lifetime access","EGP 450"]].map(([a,b,c])=><div key={a} className="flex items-center justify-between rounded-[16px] border border-[#e7e5da] bg-[#fffdf7] p-3"><div><p className="text-[11px] font-extrabold">{a}</p><p className="mt-1 text-[9px] text-[#7a8377]">{b}</p></div><b className="text-[10px]">{c}</b></div>)}
        <div className="rounded-[17px] bg-[#edf0e5] p-3 text-[9px] font-extrabold text-[#61705c]">GROCERIES · ARRIVES IN 30 MIN · FOR MAHSHI</div>
        {[["Grape leaves","EGP 22"],["Egyptian rice","EGP 18"],["Tomatoes","EGP 12"]].map(([item,price])=><div key={item} className="flex items-center justify-between border-b border-[#e9e7dc] py-2"><div><p className="text-[11px] font-bold">{item}</p><p className="text-[9px] text-[#81887c]">{price}</p></div><div className="flex items-center gap-3"><button onClick={()=>setCount(Math.max(1,count-1))}><Minus size={14}/></button><b className="text-[10px]">{count}</b><button onClick={()=>setCount(count+1)}><Plus size={14}/></button></div></div>)}
        <button onClick={()=>notify("FIRSTCOOK preview applied: 20% lesson discount")} className="flex w-full justify-between rounded-[14px] bg-[#f4e8d4] p-3 text-[10px] font-bold text-[#674d34]">FIRSTCOOK · −20% <span>Change</span></button>
        <div className="rounded-[16px] bg-[#fffdf7] p-4 text-[11px]"><p className="flex justify-between py-1">Subtotal <b>EGP 782</b></p><p className="flex justify-between py-1">Voucher <b>− EGP 56</b></p><p className="flex justify-between py-1">Delivery <b>Free</b></p><p className="mt-2 flex justify-between border-t border-[#e8e6dc] pt-3 text-[14px] font-extrabold">Total <b>EGP 726</b></p></div>
        <ScreenButton onClick={()=>notify("Checkout is a demo preview; no order will be placed.")}>Go to checkout</ScreenButton>
      </div>;
      case "Vouchers": return <div className="space-y-4">
        <div className="flex rounded-full border border-[#e7e5da] bg-[#fffdf7] p-1"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Enter promo code" className="min-w-0 flex-1 bg-transparent px-3 text-[10px] outline-none"/><button onClick={()=>notify(query.toUpperCase()==="FIRSTCOOK"?"FIRSTCOOK preview applied":"Enter an available demo code")} className="rounded-full bg-[#183328] px-4 py-2 text-[10px] font-extrabold text-white">Apply</button></div>
        <div className="flex gap-2">{["Available · 3","Used","Expired"].map(item=><button key={item} onClick={()=>setTab(item)} className={`rounded-full px-3 py-2 text-[9px] font-bold ${tab===item?"bg-[#183328] text-white":"bg-[#eeeee5] text-[#677368]"}`}>{item}</button>)}</div>
        {[
          {icon:"20% OFF",title:"First lesson discount",detail:"Any home-cook lesson · max EGP 80",code:"FIRSTCOOK",tone:"bg-[#f3dfd8]"},
          {icon:"FREE DELIVERY",title:"Free grocery delivery",detail:"Orders over EGP 300 · valid till 30 Nov",code:"FRESH30",tone:"bg-[#e6efe2]"},
          {icon:"1 + 1 COURSE",title:"Buy 1 course, get 1 free",detail:"Courses only · cheaper one free",code:"LEARN2",tone:"bg-[#f1e9d2]"},
        ].map(c=><div key={c.code} className="overflow-hidden rounded-[18px] border border-[#e7e4d8] bg-[#fffdf7]"><div className="flex items-center gap-3 p-4"><span className={`grid h-[60px] w-[72px] place-items-center rounded-[13px] px-2 text-center text-[12px] font-extrabold text-[#3b493b] ${c.tone}`}>{c.icon}</span><div className="min-w-0 flex-1"><p className="text-[12px] font-extrabold">{c.title}</p><p className="mt-1 text-[9px] text-[#7b8378]">{c.detail}</p><button onClick={()=>notify(`${c.code} preview selected`)} className="mt-2 rounded-full border border-[#e6e4da] px-2.5 py-1 text-[9px] font-bold tracking-[.08em]">{c.code}</button></div><ArrowRight size={15}/></div></div>)}
        <div className="flex items-center justify-between rounded-[16px] bg-[#eaf0e4] p-4"><div><b className="text-[11px]">Give EGP 40, get EGP 40</b><p className="mt-1 text-[9px] text-[#737e72]">Invite a friend; you both get credit after her first lesson.</p></div><button onClick={()=>notify("Invite sharing is a preview")} className="rounded-full bg-white px-3 py-2 text-[9px] font-bold">Invite</button></div>
      </div>;
      case "Checkout": return <div className="space-y-4">
        <div className="rounded-[17px] border border-[#e7e5da] bg-[#fffdf7] p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-extrabold">Deliver groceries to</p><button onClick={()=>notify("Edit delivery address preview")} className="text-[10px] font-bold text-[#40704c]">Edit</button></div><p className="mt-1 text-[10px] text-[#768073]">Home · Choose an address in checkout</p><div className="mt-3 flex gap-2">{["In 30 min","Today 5 PM","Tomorrow"].map(item=><button key={item} onClick={()=>setChosen(item)} className={`flex-1 rounded-[11px] px-2 py-2 text-[9px] font-bold ${chosen===item?"bg-[#e6efe2] text-[#315641]":"bg-[#f2f1e8] text-[#657264]"}`}>{item}</button>)}</div></div>
        <div><h3 className="mb-2 text-[12px] font-extrabold">Pay with</h3><div className="space-y-2">{["Apple Pay","Card ending 4821","Pay in 4 instalments","Mobile wallet","Cash on delivery"].map(item=><button key={item} onClick={()=>setPicked(item)} className={`flex w-full items-center gap-3 rounded-[15px] border p-3 text-left ${picked===item?"border-[#4b7d59] bg-[#e8f0e4]":"border-[#e7e5da] bg-[#fffdf7]"}`}><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#f0efe6] text-[#506450]">{item.includes("wallet")?<Wallet size={15}/>:<CreditCard size={15}/>}</span><span><b className="block text-[10px]">{item}</b><small className="text-[9px] text-[#788276]">{item.includes("Cash")?"Groceries only":"Payment selection preview"}</small></span><span className={`ml-auto grid h-4 w-4 place-items-center rounded-full border ${picked===item?"border-[#39714e] bg-[#39714e] text-white":"border-[#b9c0b4]"}`}>{picked===item&&<Check size={10}/>}</span></button>)}</div></div>
        <button onClick={()=>setSaved(!saved)} className={`flex w-full items-center justify-between rounded-[14px] p-3 text-[10px] font-bold ${saved?"bg-[#e4efe2]":"bg-[#fffdf7]"}`}>Use wallet credit <span className="text-[#38644a]">EGP 40 available · {saved?"On":"Off"}</span></button>
        <div className="rounded-[15px] bg-[#fffdf7] p-4"><p className="flex justify-between text-[10px]">Total incl. FIRSTCOOK <b className="text-[15px]">EGP 726</b></p></div>
        <ScreenButton onClick={()=>notify("Payment is disabled in this preview. No charge was made.")}>Pay with Apple Pay</ScreenButton><p className="text-center text-[9px] text-[#788276]">Lesson payment is held until your lesson is done</p>
      </div>;
      case "Confirmation": return <div className="space-y-4 text-center">
        <div className="mx-auto grid h-[70px] w-[70px] place-items-center rounded-full bg-[#e4f0e3] text-[#34734b]"><Check size={31}/></div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#638064]">Demo confirmation · no order placed</p><h2 className="text-[21px] font-extrabold">You’re all set!</h2><p className="text-[10px] text-[#7d867a]">Sample receipt · Food Hub preview</p>
        <div className="space-y-3 rounded-[18px] bg-[#fffdf7] p-4 text-left"><div className="rounded-[14px] bg-[#f1f0e7] p-3"><p className="text-[9px] font-extrabold text-[#72806e]">GROCERIES · DELIVERY PREVIEW</p><p className="mt-1 text-[11px] font-bold">Packing your order</p><p className="text-[9px] text-[#7e877b]">Estimated arrival · 28 min (sample)</p></div><div className="rounded-[14px] bg-[#e7f0e5] p-3"><p className="text-[9px] font-extrabold text-[#72806e]">YOUR LESSON</p><p className="mt-1 text-[11px] font-bold">Mahshi with Om Ahmed</p><p className="text-[9px] text-[#7e877b]">Today · 6 PM · online lesson preview</p></div><div className="rounded-[14px] bg-[#f2ead9] p-3"><p className="text-[9px] font-extrabold text-[#806746]">COURSE ACCESS</p><p className="mt-1 text-[11px] font-bold">Ramadan table course</p><p className="text-[9px] text-[#7e877b]">Preview state · not purchased</p></div></div>
        <ScreenButton secondary onClick={()=>notify("Calendar integration is not connected.")}><CalendarDays size={14}/> Add to calendar</ScreenButton><ScreenButton onClick={()=>notify("Video call is not connected.")}><Video size={14}/> Join lesson preview</ScreenButton><button onClick={()=>notify("Returned to Food Hub home preview")} className="w-full py-2 text-[10px] font-bold text-[#366549]">Back to home</button>
      </div>;
      case "Courses": return <div className="space-y-4">
        <div className="rounded-[19px] bg-[#20362a] p-4 text-[#fffdf4]"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#d5dfd2]">Continue · lesson 9 of 20</p><h3 className="mt-2 text-[15px] font-extrabold">The newlywed kitchen</h3><p className="mt-1 text-[10px] text-[#d8e0d5]">20 everyday dishes · pick up where you left off</p><button onClick={()=>notify("Course player is a preview")} className="mt-3 rounded-full bg-[#f2eddb] px-4 py-2 text-[10px] font-extrabold text-[#315641]">Resume course <Play size={11} className="ml-1 inline"/></button></div>
        <div className="flex gap-2 overflow-x-auto">{["All","Egyptian","Baking","Healthy","Kids"].map(item=><button key={item} onClick={()=>setTab(item)} className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-bold ${tab===item?"bg-[#285c43] text-white":"bg-[#fffdf7] text-[#667466]"}`}>{item}</button>)}</div>
        {[
          {title:"Ramadan table: 30 iftar dishes",teacher:"Om Ahmed · home cook",price:"EGP 380",img:"/__mockup/images/food-hub/mahshi.jpg",reviews:"4.9 · 32 lessons"},
          {title:"Egyptian street-food from scratch",teacher:"Nadia · home cook",price:"EGP 320",img:"/__mockup/images/food-hub/koshari.jpg",reviews:"4.8 · 18 lessons"},
          {title:"Healthy family meals",teacher:"Maha · chef",price:"EGP 290",img:"/__mockup/images/food-hub/molokhia.jpg",reviews:"4.7 · 24 lessons"},
        ].map(c=><button key={c.title} onClick={()=>notify(`${c.title} course preview`)} className="w-full overflow-hidden rounded-[17px] border border-[#e7e6da] bg-[#fffdf7] text-left"><img src={c.img} alt={c.title} className="h-[132px] w-full object-cover"/><div className="p-3"><p className="text-[12px] font-extrabold">{c.title}</p><p className="mt-1 text-[9px] text-[#758073]">{c.teacher} · {c.reviews}</p><p className="mt-2 text-[11px] font-extrabold text-[#366449]">{c.price} · Course preview</p></div></button>)}
        <div className="flex items-center justify-between rounded-[17px] bg-[#f0ead9] p-4"><div><b className="text-[12px]">Food Hub Premium</b><p className="mt-1 text-[9px] text-[#737c70]">All courses, no ads, AI meal plans</p></div><button onClick={()=>notify("Subscription is not available in this preview")} className="rounded-full bg-[#25382b] px-3 py-2 text-[9px] font-bold text-white">Try free</button></div>
      </div>;
      case "Profile": return <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-[18px] bg-[#e8efe4] p-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-[#efd2b6] text-[16px] font-extrabold text-[#674b34]">M</div><div><p className="text-[15px] font-extrabold">Mariam</p><p className="text-[10px] text-[#748073]">Home chef · Level 3</p></div><button onClick={()=>notify("Edit profile preview")} className="ml-auto rounded-full bg-white px-3 py-2 text-[9px] font-bold">Edit</button></div>
        <div className="rounded-[17px] bg-[#20362a] p-4 text-white"><div className="flex items-center justify-between"><p className="text-[11px] font-bold">Wallet balance</p><Wallet size={16}/></div><p className="mt-2 text-[25px] font-extrabold">EGP 240</p><p className="text-[9px] text-[#d1dccd]">Sample balance · refunds and referral credit</p><button onClick={()=>notify("Wallet top-up is not available in preview")} className="mt-3 rounded-full bg-[#f1ead7] px-4 py-2 text-[10px] font-bold text-[#315641]">Top up preview</button></div>
        <div className="grid grid-cols-2 gap-2">{[["Chef points","340 pts"],["Cooking streak","5 days"],["Orders & lessons","1 today"],["My courses","2"],["Vouchers","3 new"],["Saved recipes","24"]].map(([a,b])=><button key={a} onClick={()=>notify(`${a} preview`)} className="rounded-[15px] border border-[#e8e6db] bg-[#fffdf7] p-3 text-left"><span className="block text-[9px] text-[#7e887b]">{a}</span><b className="mt-1 block text-[13px]">{b}</b></button>)}</div>
        <div className="overflow-hidden rounded-[16px] border border-[#e6e5d9] bg-[#fffdf7]">{["Payment methods & addresses","Language · English","Display preferences","Help & safety"].map(i=><button key={i} onClick={()=>notify(`${i} settings preview`)} className="flex w-full justify-between border-b border-[#eeece3] p-3 text-left text-[10px] font-semibold">{i}<ChevronRight size={13}/></button>)}</div>
        <button onClick={()=>notify("Home-cook application preview")} className="w-full rounded-[17px] bg-[#eaf0e4] p-4 text-left"><b className="text-[12px]">Love cooking? Teach & earn</b><span className="mt-1 block text-[9px] text-[#72806f]">Become a Food Hub home cook →</span></button>
      </div>;
      case "CookDashboard": return <div className="space-y-4">
        <div className="flex items-center justify-between rounded-[17px] bg-[#e8efe4] p-4"><div><p className="text-[10px] font-bold text-[#698066]">Your availability</p><p className="text-[14px] font-extrabold">Taking new lessons</p></div><button onClick={()=>setSaved(!saved)} className={`rounded-full px-3 py-2 text-[9px] font-extrabold ${saved?"bg-[#b5c2a8]":"bg-[#315f44] text-white"}`}>{saved?"Paused":"Available"}</button></div>
        <div className="rounded-[18px] bg-[#20362a] p-4 text-white"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#d0ddcc]">Demo earnings this month</p><p className="mt-2 text-[27px] font-extrabold">EGP 4,820</p><p className="mt-1 text-[9px] text-[#d0ddcc]">Sample only · 18 lessons · +18% vs last month</p><div className="mt-4 flex h-[60px] items-end justify-between gap-2">{[30,45,36,62,47,78,56].map((h,i)=><span key={i} style={{height:`${h}%`}} className="flex-1 rounded-t bg-[#bdceaf]"/>)}</div><div className="mt-2 flex justify-between text-[8px] text-[#d0ddcc]"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div></div>
        <div className="rounded-[18px] border border-[#e6e5d9] bg-[#fffdf7] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#8a7658]">Next lesson · in 42 min · online</p><div className="mt-3 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#f0d9c4] text-[12px] font-extrabold">M</div><div className="flex-1"><p className="text-[12px] font-extrabold">Mariam · Riyadh</p><p className="text-[9px] text-[#758073]">Mahshi warak enab · first lesson</p></div><button onClick={()=>notify("Video lesson is not connected.")} className="rounded-full bg-[#285c43] px-3 py-2 text-[9px] font-bold text-white">Start</button></div></div>
        <h3 className="text-[13px] font-extrabold">Coming up</h3>
        {["Fri 2 PM · Salma · Molokhia · Home visit", "Sat 7 PM · Nour · Fattah · Online"].map((item) => (
          <div key={item} className="rounded-[14px] bg-[#fffdf7] p-3 text-[10px] font-semibold">{item}</div>
        ))}
        <div className="grid grid-cols-2 gap-2">
          {["Dishes & prices · 8 listed", "My availability · Sun–Thu", "Record a course", "Withdraw · demo wallet"].map((item) => (
            <button key={item} onClick={() => notify(`${item} preview`)} className="rounded-[14px] border border-[#e7e5da] bg-[#fffdf7] p-3 text-left text-[10px] font-bold">{item}</button>
          ))}
        </div>
      </div>;
      case "Onboarding": return <div className="space-y-4">
        <div className="rounded-[18px] bg-[#fffdf7] p-4 shadow-[0_5px_14px_rgba(40,55,42,.04)]"><div className="flex items-center justify-between"><h3 className="text-[12px] font-extrabold">Hours you can teach per week</h3><span className="text-[18px] font-extrabold text-[#35714c]">{count*4} hrs</span></div><input type="range" min="1" max="12" value={count*4} onChange={e=>setCount(Math.max(1,Number(e.target.value)/4))} className="mt-4 w-full accent-[#34704d]"/><p className="mt-2 text-[10px] leading-5 text-[#788176]">An estimate only; actual lesson bookings and earnings vary. Your hourly price is your choice, less the platform fee.</p></div>
        <div className="space-y-2">{[
          ["Your details","Name, area, languages",true],["Verify your ID","Private ID and selfie review",true],["Show your kitchen","3 photos for a hygiene check",false],["Dishes & price","Choose your lessons and hourly rate",false],["Trial lesson","Short video call with our team",false],["Get paid","Choose mobile wallet or bank",false],
        ].map(([name,detail,done],i)=><button key={String(name)} onClick={()=>setChosen(String(name))} className={`flex w-full items-center gap-3 rounded-[16px] border bg-[#fffdf7] p-3 text-left ${chosen===name?"border-2 border-[#39714e]":"border-[#ebe8dc]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${done?"bg-[#377550] text-white":"bg-[#f0efe8] text-[#7e8274]"}`}>{done?<Check size={15}/>:i+1}</span><span className="min-w-0 flex-1"><b className="block text-[11px]">{name}</b><small className="text-[9px] text-[#7a8377]">{detail}</small></span><ChevronRight size={15} className="text-[#788177]"/></button>)}</div>
        <div className="rounded-[15px] border border-[#e7e4d7] bg-[#f3f0e4] p-3"><p className="text-[10px] font-extrabold">Your details stay yours</p><p className="mt-1 text-[9px] leading-4 text-[#737e71]">ID and kitchen photos are for verification only. Explain access, reviewer, retention and removal before asking someone to submit them.</p></div>
        <ScreenButton onClick={()=>notify(chosen?`${chosen} onboarding preview`:"Kitchen-photo step preview")}>Continue: {chosen||"Show your kitchen"}</ScreenButton><button onClick={()=>notify("Cook dashboard preview")} className="w-full py-2 text-[10px] font-bold text-[#376249]">Preview your cook dashboard</button>
      </div>;
    }
  })();

  return <main style={screen==="CookMode"?{background:"#17271e",color:"#fffdf4"}:undefined} className={`fh-home relative mx-auto flex h-[100dvh] min-h-[680px] w-full max-w-[430px] flex-col overflow-hidden ${screen==="CookMode"?"bg-[#17271e]":"bg-[#faf8ef]"}`}>
    <header className={`shrink-0 border-b px-5 pb-3 pt-4 ${screen==="CookMode"?"border-white/10":"border-[#eae8dc]"}`}><div className="flex items-center justify-between"><button onClick={()=>notify("Back to previous preview screen")} aria-label="Go back" className={`grid h-9 w-9 place-items-center rounded-full ${screen==="CookMode"?"bg-[#2c4032] text-white":"bg-[#fffdf7] text-[#345d42]"}`}><ArrowLeft size={17}/></button><div className="text-center"><p className={`text-[9px] font-extrabold uppercase tracking-[.14em] ${screen==="CookMode"?"text-[#c5d5c2]":"text-[#937553]"}`}>{copy.eyebrow}</p><p className={`mt-1 text-[12px] font-extrabold ${screen==="CookMode"?"text-white":"text-[#34463a]"}`}>Food Hub · preview</p></div><button onClick={()=>notify("This is an interactive design preview")} aria-label="Preview information" className={`grid h-9 w-9 place-items-center rounded-full ${screen==="CookMode"?"bg-[#2c4032] text-white":"bg-[#fffdf7] text-[#345d42]"}`}><Sparkles size={16}/></button></div></header>
    <div className={`min-h-0 flex-1 overflow-y-auto px-5 pb-8 ${screen==="CookMode"?"text-[#fffdf4]":"text-[#26392d]"}`}>
      <div className="pb-4 pt-5"><h1 className={`font-['Manrope'] text-[25px] font-extrabold leading-[1.1] tracking-[-.9px] ${screen==="CookMode"?"text-white":"text-[#26392d]"}`}>{copy.title}</h1><p className={`mt-2 text-[11px] leading-[1.6] ${screen==="CookMode"?"text-[#ced9cc]":"text-[#788276]"}`}>{copy.subtitle}</p></div>
      {page}
      <p className="mt-5 text-center text-[8px] text-[#92968a]">Concept preview · sample content and prices · no bookings or payments</p>
    </div>
    {notice&&<div role="status" className="absolute bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#203a2b] px-4 py-2.5 text-center text-[10px] font-semibold text-white shadow-lg">{notice}</div>}
  </main>;
}

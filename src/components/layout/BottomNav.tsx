"use client";

import { useRouter } from "next/navigation";

type NavTab = "home" | "explore" | "places" | "market" | "profile";

const TABS: { id: NavTab; label: string; path: string; icon: string; activeIcon: string }[] = [
  { id: "home",    label: "Home",    path: "/",          icon: "⊙", activeIcon: "⊙" },
  { id: "explore", label: "Explore", path: "/explore",   icon: "◎", activeIcon: "◎" },
  { id: "places",  label: "Places",  path: "/places",    icon: "◻", activeIcon: "◼" },
  { id: "market",  label: "Market",  path: "/market",    icon: "◻", activeIcon: "◼" },
  { id: "profile", label: "Profile", path: "/profile",   icon: "◻", activeIcon: "◼" },
];

export default function BottomNav({ active }: { active: NavTab }) {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center border-t border-slate-200/80 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className="flex flex-col items-center gap-[3px] px-3 py-1"
          >
            <div
              className={`w-[22px] h-[22px] rounded-[7px] transition-colors ${
                isActive ? "bg-teal-600" : "bg-slate-200"
              }`}
            />
            <span
              className={`text-[9px] font-medium transition-colors ${
                isActive ? "text-teal-600" : "text-slate-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

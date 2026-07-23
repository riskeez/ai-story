import type { Provider } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Провайдеры входа. Добавить новый — одна строка (напр. { id: "azure", label: "Microsoft" }).
export const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "Продолжить с Google" },
];

export function signInWith(
  provider: Provider,
  next = location.pathname + location.search
) {
  const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  return supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
}

export function signOut() {
  return supabase.auth.signOut();
}

// Вешает вход на кнопку-триггер. Один провайдер — вход сразу; несколько — меню.
export function attachLoginMenu(trigger: HTMLElement) {
  if (PROVIDERS.length <= 1) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      signInWith(PROVIDERS[0].id);
    });
    return;
  }

  const menu = document.createElement("div");
  menu.className = "login-menu";
  menu.hidden = true;
  for (const p of PROVIDERS) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "login-menu-item";
    item.textContent = p.label;
    item.addEventListener("click", () => signInWith(p.id));
    menu.appendChild(item);
  }

  const parent = trigger.parentElement!;
  if (getComputedStyle(parent).position === "static")
    parent.style.position = "relative";
  trigger.insertAdjacentElement("afterend", menu);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener("click", () => (menu.hidden = true));
}

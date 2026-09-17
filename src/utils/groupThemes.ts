export interface ColorTheme {
  name: string;
  badge: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
  hoverBg: string;
  lightBg: string;
}

export const GROUP_THEMES: ColorTheme[] = [
  {
    name: '海洋藍',
    badge: 'bg-sky-500 text-white',
    bg: 'bg-sky-50/80',
    border: 'border-sky-200',
    text: 'text-sky-950',
    accent: 'bg-sky-600',
    hoverBg: 'hover:bg-sky-100',
    lightBg: 'bg-sky-100/70',
  },
  {
    name: '青草綠',
    badge: 'bg-emerald-500 text-white',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    accent: 'bg-emerald-600',
    hoverBg: 'hover:bg-emerald-100',
    lightBg: 'bg-emerald-100/70',
  },
  {
    name: '晨光橘',
    badge: 'bg-amber-500 text-white',
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-950',
    accent: 'bg-amber-600',
    hoverBg: 'hover:bg-amber-100',
    lightBg: 'bg-amber-100/70',
  },
  {
    name: '薰衣紫',
    badge: 'bg-purple-500 text-white',
    bg: 'bg-purple-50/80',
    border: 'border-purple-200',
    text: 'text-purple-950',
    accent: 'bg-purple-600',
    hoverBg: 'hover:bg-purple-100',
    lightBg: 'bg-purple-100/70',
  },
  {
    name: '玫瑰紅',
    badge: 'bg-rose-500 text-white',
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-950',
    accent: 'bg-rose-600',
    hoverBg: 'hover:bg-rose-100',
    lightBg: 'bg-rose-100/70',
  },
  {
    name: '青蘋青',
    badge: 'bg-teal-500 text-white',
    bg: 'bg-teal-50/80',
    border: 'border-teal-200',
    text: 'text-teal-950',
    accent: 'bg-teal-600',
    hoverBg: 'hover:bg-teal-100',
    lightBg: 'bg-teal-100/70',
  },
  {
    name: '曜石靛',
    badge: 'bg-indigo-500 text-white',
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    accent: 'bg-indigo-600',
    hoverBg: 'hover:bg-indigo-100',
    lightBg: 'bg-indigo-100/70',
  },
  {
    name: '珊瑚粉',
    badge: 'bg-pink-500 text-white',
    bg: 'bg-pink-50/80',
    border: 'border-pink-200',
    text: 'text-pink-950',
    accent: 'bg-pink-600',
    hoverBg: 'hover:bg-pink-100',
    lightBg: 'bg-pink-100/70',
  },
];

export const WC_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type WcGroup = (typeof WC_GROUPS)[number];

export interface WcGroupStyle {
  bg: string;
  border: string;
  text: string;
  activeBg: string;
}

export const WC_GROUP_STYLES: Record<WcGroup, WcGroupStyle> = {
  A: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.45)', text: '#f87171', activeBg: 'rgba(239, 68, 68, 0.22)' },
  B: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.45)', text: '#60a5fa', activeBg: 'rgba(59, 130, 246, 0.22)' },
  C: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.45)', text: '#34d399', activeBg: 'rgba(16, 185, 129, 0.22)' },
  D: { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.45)', text: '#c084fc', activeBg: 'rgba(168, 85, 247, 0.22)' },
  E: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.45)', text: '#fbbf24', activeBg: 'rgba(245, 158, 11, 0.22)' },
  F: { bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.45)', text: '#2dd4bf', activeBg: 'rgba(20, 184, 166, 0.22)' },
  G: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.45)', text: '#fb923c', activeBg: 'rgba(249, 115, 22, 0.22)' },
  H: { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.45)', text: '#f472b6', activeBg: 'rgba(236, 72, 153, 0.22)' },
  I: { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.45)', text: '#818cf8', activeBg: 'rgba(99, 102, 241, 0.22)' },
  J: { bg: 'rgba(132, 204, 22, 0.12)', border: 'rgba(132, 204, 22, 0.45)', text: '#a3e635', activeBg: 'rgba(132, 204, 22, 0.22)' },
  K: { bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.45)', text: '#38bdf8', activeBg: 'rgba(14, 165, 233, 0.22)' },
  L: { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.45)', text: '#facc15', activeBg: 'rgba(234, 179, 8, 0.22)' },
};

export function isWcGroup(value: string): value is WcGroup {
  return (WC_GROUPS as readonly string[]).includes(value);
}

export function groupTabLabel(group: WcGroup): string {
  return `Группа ${group}`;
}

import { DEFAULT_LEAGUE_EMOJI, normalizeLeagueBg } from '../data/league-emojis';

interface Props {
  emoji?: string | null;
  bgColor?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeagueEmoji({ emoji, bgColor, size = 'md', className = '' }: Props) {
  const bg = bgColor ? normalizeLeagueBg(bgColor) : null;
  const useCustomBg = Boolean(bg && size !== 'sm');

  return (
    <span
      className={`league-emoji league-emoji--${size}${useCustomBg ? ' league-emoji--custom-bg' : ''}${className ? ` ${className}` : ''}`}
      style={
        useCustomBg
          ? {
              background: bg!,
              borderColor: `${bg}99`,
            }
          : undefined
      }
      aria-hidden="true"
    >
      {emoji?.trim() || DEFAULT_LEAGUE_EMOJI}
    </span>
  );
}

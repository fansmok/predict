import type { ReactNode } from 'react';

interface Props {
  active: boolean;
  children: ReactNode;
}

/** Список матчей остаётся в DOM — быстрое переключение «Все» / «Результаты» / группы. */
export function MatchFilterPanel({ active, children }: Props) {
  return (
    <div className={`matches-filter-panel${active ? ' matches-filter-panel--active' : ''}`} hidden={!active}>
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import type { Tab } from '../types';

interface Props {
  tab: Tab;
  activeTab: Tab;
  children: ReactNode;
}

/** Держит вкладку в DOM после первого показа — быстрое переключение без перемонтирования. */
export function TabPanel({ tab, activeTab, children }: Props) {
  const isActive = activeTab === tab;
  return (
    <div
      className={`tab-panel${isActive ? ' tab-panel--active' : ''}`}
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

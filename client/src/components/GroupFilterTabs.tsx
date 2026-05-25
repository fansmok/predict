import type { CSSProperties } from 'react';
import { WC_GROUPS, WcGroup, WC_GROUP_STYLES, groupTabLabel, isWcGroup } from '../wc-groups';

export const FINISHED_TAB = 'finished';

interface Props {
  active: string;
  onChange: (group: string) => void;
}

export function GroupFilterTabs({ active, onChange }: Props) {
  return (
    <div className="group-tabs" role="tablist" aria-label="Фильтр матчей">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'all'}
        aria-label="Все матчи"
        className={`group-tab all ${active === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        <span className="group-tab-letter">★</span>
        <span className="group-tab-label">все</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={active === FINISHED_TAB}
        className={`group-tab finished ${active === FINISHED_TAB ? 'active' : ''}`}
        aria-label="Результаты"
        onClick={() => onChange(FINISHED_TAB)}
      >
        <span className="group-tab-letter">✓</span>
        <span className="group-tab-label">Результаты</span>
      </button>

      {WC_GROUPS.map(g => {
        const style = WC_GROUP_STYLES[g];
        const isActive = active === g;
        return (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={groupTabLabel(g)}
            className={`group-tab ${isActive ? 'active' : ''}`}
            style={{
              '--tab-bg': isActive ? style.activeBg : style.bg,
              '--tab-border': style.border,
              '--tab-text': style.text,
            } as CSSProperties}
            onClick={() => onChange(g)}
          >
            <span className="group-tab-letter">{g}</span>
            <span className="group-tab-label">группа</span>
          </button>
        );
      })}
    </div>
  );
}

export function isGroupTab(value: string): value is WcGroup {
  return isWcGroup(value);
}

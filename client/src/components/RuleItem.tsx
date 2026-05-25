import type { Rule } from '../types';

export function rulePointsMeta(rule: Rule): { className: string; label: string } {
  if (rule.kind === 'double') {
    return { className: 'px2', label: '×2' };
  }

  if (rule.kind === 'penalty' || rule.points < 0) {
    return { className: 'penalty', label: String(rule.points) };
  }

  const { points } = rule;
  const className =
    points === 5 ? 'p5'
    : points === 3 ? 'p3'
    : points === 2 ? 'p2'
    : points >= 20 ? 'ptourn'
    : points >= 10 ? 'ptourn-sm'
    : points === 1 ? 'psquad'
    : 'p0';

  const label = points === 0 ? '0' : `+${points}`;
  return { className, label };
}

export function RuleItem({ rule }: { rule: Rule }) {
  const { className, label } = rulePointsMeta(rule);

  return (
    <div className="rule-item">
      <div className={`rule-points ${className}`} aria-hidden="true">{label}</div>
      <div className="rule-text">
        <h4>{rule.label}</h4>
        <p>{rule.description}</p>
      </div>
    </div>
  );
}

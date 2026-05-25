import type { Rule } from '../types';
import { RuleItem } from '../components/RuleItem';
import { IconBall, IconSquad, IconTrophy } from '../components/Icons';

interface Props {
  rules: Rule[];
  onBack: () => void;
}

const MATCH_LABELS = ['Точный счёт', 'Разница мячей', 'Исход матча', '×2 бонус', 'Мимо'];
const TOURNAMENT_LABELS = ['Победитель ЧМ', '2-е место', '3-е место', 'Бомбардир'];
const SQUAD_LABELS = [
  'Победа команды',
  'Гол',
  'Голевая передача',
  'Сухой матч (ВР/ЗЩ)',
  'Пропущенный гол (ВР/ЗЩ)',
  'Удаление',
];

function pickRules(rules: Rule[], labels: string[]): Rule[] {
  const byLabel = new Map(rules.map(r => [r.label, r]));
  return labels.map(label => byLabel.get(label)).filter((r): r is Rule => Boolean(r));
}

const SECTIONS = [
  {
    id: 'matches',
    title: 'Прогнозы на матчи',
    Icon: IconBall,
    tone: 'accent',
    intro: 'Ставьте счёт до начала матча. В каждом игровом дне вы можете выбрать двойную ставку.',
    labels: MATCH_LABELS,
  },
  {
    id: 'tournament',
    title: 'Прогнозы на турнир',
    Icon: IconTrophy,
    tone: 'gold',
    intro: 'До старта ЧМ выберите победителя, призёров и бомбардира.',
    labels: TOURNAMENT_LABELS,
  },
  {
    id: 'squad',
    title: 'Fantasy-команда',
    Icon: IconSquad,
    tone: 'blue',
    intro:
      'Главное правило: очки и штрафы начисляются только если игрок принял участие в матче. Соберите 11 игроков из разных сборных; редактировать команду можно только до старта ЧМ.',
    constraints: [
      'В fantasy-команду можно взять до 2 игроков из одной сборной.',
      'До 3 игроков из каждой категории сборной (категория определяется рейтингом FIFA); в категории 4 — не более 2.',
    ],
    labels: SQUAD_LABELS,
  },
] as const;

export function RulesPage({ rules, onBack }: Props) {
  return (
    <div className="rules-page page-stack">
      <button type="button" className="rules-back-btn" onClick={onBack}>
        ← Назад
      </button>

      <header className="rules-page-header">
        <h2 className="rules-page-title">Как начисляются очки</h2>
        <p className="rules-page-lead">
          Три источника очков: матчи группового этапа, итоги чемпионата и ваша fantasy-команда.
        </p>
      </header>

      {SECTIONS.map(section => {
        const { id, title, Icon, tone, intro, labels } = section;
        const constraints = 'constraints' in section ? section.constraints : undefined;
        const sectionRules = pickRules(rules, [...labels]);
        if (sectionRules.length === 0) return null;

        return (
          <section key={id} className="rules-section profile-card-block">
            <div className="rules-section-head">
              <div className={`rules-section-icon ${tone}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="rules-section-title">{title}</h3>
                <p className="rules-section-intro">{intro}</p>
                {constraints && constraints.length > 0 && (
                  <ul className="rules-section-constraints">
                    {constraints.map(text => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="profile-rules-list">
              {sectionRules.map(rule => (
                <RuleItem key={rule.label} rule={rule} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

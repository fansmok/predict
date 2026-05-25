import { IconBall, IconGoalConceded, IconGlove, IconPass, IconRedCard, IconTrophy } from './Icons';
import { SQUAD_SCORING } from '../squadScoring';

const POSITIVE_RULES = [
  { Icon: IconTrophy, tone: 'gold', label: 'Победа', hint: 'участие в матче, сборная выиграла', pts: SQUAD_SCORING.win },
  { Icon: IconBall, tone: 'accent', label: 'Гол', hint: 'участие в матче и гол', pts: SQUAD_SCORING.goal },
  { Icon: IconPass, tone: 'blue', label: 'Передача', hint: 'участие в матче и голевая', pts: SQUAD_SCORING.assist },
  { Icon: IconGlove, tone: 'blue', label: 'Сухой матч', hint: 'ВР или ЗЩ, участие в матче', pts: SQUAD_SCORING.cleanSheet },
] as const;

const NEGATIVE_RULES = [
  { Icon: IconGoalConceded, tone: 'red', label: 'Пропущенный гол', hint: 'ВР или ЗЩ, участие в матче', pts: SQUAD_SCORING.goalConceded },
  { Icon: IconRedCard, tone: 'red', label: 'Удаление', hint: 'участие в матче, красная карточка', pts: SQUAD_SCORING.sentOff },
] as const;

interface Props {
  lateSquad?: boolean;
}

export function SquadScoringPanel({ lateSquad = false }: Props) {
  return (
    <section className="squad-scoring-panel" aria-label="Как начисляются очки">
      <div className="squad-scoring-head">
        <span className="squad-scoring-title">Как начисляются очки</span>
      </div>
      <p className="squad-scoring-note squad-scoring-note--main">
        Очки и штрафы считаются только если игрок принял участие в матче.
      </p>
      {lateSquad && (
        <p className="squad-scoring-note">
          Состав подтверждён после старта ЧМ — очки только за матчи, которые ещё не начались на момент сохранения.
        </p>
      )}
      <div className="squad-scoring-grid">
        {POSITIVE_RULES.map(({ Icon, tone, label, hint, pts }) => (
          <div key={label} className={`squad-scoring-card ${tone}`}>
            <div className={`squad-scoring-icon-wrap ${tone}`}>
              <Icon size={18} />
            </div>
            <div className="squad-scoring-text">
              <span className="squad-scoring-label">{label}</span>
              <span className="squad-scoring-hint">{hint}</span>
            </div>
            <span className="squad-scoring-pts">+{pts}</span>
          </div>
        ))}
      </div>
      <div className="squad-scoring-grid squad-scoring-grid--penalties">
        {NEGATIVE_RULES.map(({ Icon, tone, label, hint, pts }) => (
          <div key={label} className={`squad-scoring-card ${tone}`}>
            <div className={`squad-scoring-icon-wrap ${tone}`}>
              <Icon size={18} />
            </div>
            <div className="squad-scoring-text">
              <span className="squad-scoring-label">{label}</span>
              <span className="squad-scoring-hint">{hint}</span>
            </div>
            <span className="squad-scoring-pts">{pts}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

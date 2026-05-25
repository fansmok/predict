import { useCallback, useState } from 'react';
import { copyTextToClipboard, shareTelegramLink } from '../utils';
import { IconCopy, IconLink } from './Icons';

interface Props {
  link: string;
  shareText: string;
  className?: string;
  variant?: 'default' | 'hero';
  shareLabel?: string;
}

export function InviteLinkActions({
  link,
  shareText,
  className = '',
  variant = 'default',
  shareLabel = 'Отправить',
}: Props) {
  const [copied, setCopied] = useState(false);

  const haptic = (type: 'light' | 'success' | 'error') => {
    const fb = window.Telegram?.WebApp?.HapticFeedback;
    if (type === 'light') fb?.impactOccurred('light');
    else fb?.notificationOccurred(type);
  };

  const handleShare = useCallback(() => {
    haptic('light');
    shareTelegramLink(link, shareText);
  }, [link, shareText]);

  const handleCopy = useCallback(async () => {
    haptic('light');
    const ok = await copyTextToClipboard(link);
    if (ok) {
      setCopied(true);
      haptic('success');
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      haptic('error');
    }
  }, [link]);

  return (
    <div className={`invite-link-actions invite-link-actions--${variant} ${className}`.trim()}>
      <button type="button" className="invite-link-btn invite-link-btn--share" onClick={handleShare}>
        <IconLink size={18} aria-hidden="true" />
        <span>{shareLabel}</span>
      </button>
      <button
        type="button"
        className={`invite-link-btn invite-link-btn--copy${copied ? ' copied' : ''}`}
        onClick={handleCopy}
      >
        <IconCopy size={18} aria-hidden="true" />
        <span>{copied ? 'Скопировано' : 'Копировать'}</span>
      </button>
    </div>
  );
}

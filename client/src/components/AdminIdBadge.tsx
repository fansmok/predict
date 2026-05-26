import type { MouseEvent } from 'react';

interface Props {
  id: number;
  label?: string;
  className?: string;
}

export function AdminIdBadge({ id, label = 'ID', className = '' }: Props) {
  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    void navigator.clipboard?.writeText(String(id)).catch(() => {});
  };

  return (
    <span
      className={`admin-id-badge ${className}`.trim()}
      onClick={handleCopy}
      title={`Скопировать ${label}: ${id}`}
      role="note"
    >
      {label} #{id}
    </span>
  );
}

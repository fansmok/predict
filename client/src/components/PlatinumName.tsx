import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  platinum?: boolean;
  className?: string;
  as?: 'span' | 'div';
}

export function PlatinumName({ children, platinum, className = '', as: Tag = 'span' }: Props) {
  if (!platinum) {
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <Tag className={`name-platinum ${className}`.trim()}>
      {children}
      <span className="name-platinum-mark" aria-hidden="true">◆</span>
    </Tag>
  );
}

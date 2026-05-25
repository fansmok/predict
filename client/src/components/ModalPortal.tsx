import { createPortal } from 'react-dom';

interface Props {
  children: React.ReactNode;
}

export function ModalPortal({ children }: Props) {
  return createPortal(children, document.body);
}

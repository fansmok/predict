interface Props {
  onClose: () => void;
  label?: string;
}

export function SheetModalCloseFooter({ onClose, label = 'Закрыть' }: Props) {
  return (
    <footer className="sheet-modal-footer">
      <button type="button" className="sheet-modal-close-btn" onClick={onClose}>
        {label}
      </button>
    </footer>
  );
}

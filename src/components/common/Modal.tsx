import { Dialog, DialogTitle, DialogContent, DialogActions, type DialogProps } from "@mui/material";

interface Props extends Omit<DialogProps, "open" | "onClose"> {
  open: boolean;
  title?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

// Wrapper around MUI Dialog used for the few modal screens in this app.
export default function Modal({ open, title, onClose, actions, children, ...rest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} {...rest}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent>{children}</DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}

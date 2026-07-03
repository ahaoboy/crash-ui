import { forwardRef } from "react";
import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
  CircularProgress,
} from "@mui/material";

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

// Thin wrapper around MUI Button that renders a spinner in the label slot while
// `loading` is true. Mirrors the upstream `<Button>` affordance.
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { loading, children, disabled, ...rest },
  ref,
) {
  return (
    <MuiButton ref={ref} disabled={disabled || loading} {...rest}>
      {loading ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </MuiButton>
  );
});

export default Button;

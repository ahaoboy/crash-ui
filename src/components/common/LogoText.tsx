import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

const Root = styled(Box)(({ theme }) => ({
  fontFamily: theme.typography.h1.fontFamily,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  "& .accent": { color: theme.palette.primary.main },
}));

// Compact "MetaCubeXD" wordmark with the trailing "XD" rendered in the primary
// color — mirrors the upstream LogoText component for the sidebar/header.
export default function LogoText({ size = 18 }: { size?: number }) {
  return (
    <Root sx={{ fontSize: size, lineHeight: 1 }}>
      <span>MetaCube</span>
      <span className="accent">XD</span>
    </Root>
  );
}

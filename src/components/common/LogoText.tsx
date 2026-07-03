import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

const Root = styled(Box)(({ theme }) => ({
  fontFamily: theme.typography.h1.fontFamily,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  "& .accent": { color: theme.palette.primary.main },
}));

export default function LogoText({ size = 18 }: { size?: number }) {
  return (
    <Root sx={{ fontSize: size, lineHeight: 1 }}>
      <span>Crash</span>
      <span className="accent">UI</span>
    </Root>
  );
}

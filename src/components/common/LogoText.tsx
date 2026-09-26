import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

const logoStyles = ({ theme }: { theme: import("@mui/material/styles").Theme }) => ({
  fontFamily: theme.typography.h1.fontFamily,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  "& .accent": { color: theme.palette.primary.main },
});

const Root = styled(Box)(logoStyles);

// Styled directly from the anchor element so `href`/`target`/`rel` are typed.
const LinkRoot = styled("a")(({ theme }) => ({
  ...logoStyles({ theme }),
  textDecoration: "none",
  color: "inherit",
  // Underline the whole brand mark, not just the `.accent` span — nested
  // text-decoration from the parent applies to all child text.
  "&:hover": { textDecoration: "underline" },
}));

interface Props {
  size?: number;
  /** When set, the logo renders as an external link. */
  href?: string;
}

export default function LogoText({ size = 18, href }: Props) {
  const content = (
    <>
      <span>Crash</span>
      <span className="accent">UI</span>
    </>
  );

  if (href) {
    return (
      <LinkRoot
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        title={href}
        sx={{ fontSize: size, lineHeight: 1 }}
      >
        {content}
      </LinkRoot>
    );
  }

  return <Root sx={{ fontSize: size, lineHeight: 1 }}>{content}</Root>;
}

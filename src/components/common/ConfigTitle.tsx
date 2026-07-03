import { Typography, type TypographyOwnProps } from "@mui/material";

interface Props extends TypographyOwnProps {
  title: string;
  subtitle?: string;
}

// Section title for config page sections — small uppercase label + description.
export default function ConfigTitle({ title, subtitle, ...rest }: Props) {
  return (
    <div>
      <Typography variant="overline" component="h2" {...rest}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </div>
  );
}

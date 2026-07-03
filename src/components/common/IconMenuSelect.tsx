import { MenuItem, TextField } from "@mui/material";

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  size?: "small" | "medium";
  sx?: object;
}

// Compact labelled <select> backed by MUI's TextField + MenuItem — used by the
// proxies display-mode / sort / card-size controls.
export default function IconMenuSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "small",
  sx,
}: Props<T>) {
  return (
    <TextField
      select
      label={label}
      value={value}
      size={size}
      onChange={(e) => onChange(e.target.value as T)}
      sx={{ minWidth: 140, ...sx }}
      slotProps={{
        select: {
          renderValue: (val: unknown) => {
            const opt = options.find((o) => o.value === val);
            if (!opt) return val as string;
            return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {opt.icon}
                {opt.label}
              </span>
            );
          },
        },
      }}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "100%" }}>
            {opt.icon}
            {opt.label}
          </span>
        </MenuItem>
      ))}
    </TextField>
  );
}

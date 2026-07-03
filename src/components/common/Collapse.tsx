import { useState, type ReactNode } from "react";
import { Collapse as MuiCollapse, IconButton } from "@mui/material";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

interface Props {
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

// Generic card-style collapse header used on config/proxies sections.
export default function Collapse({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label="toggle section">
          {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
        </IconButton>
        <div style={{ flex: 1 }}>{title}</div>
      </div>
      <MuiCollapse in={open}>{children}</MuiCollapse>
    </div>
  );
}

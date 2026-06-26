import { FormControlLabel, Switch } from "@mui/material";

type Props = {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
};

export default function MaSwitchField({ checked, label, onChange }: Props) {
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      label={label}
    />
  );
}

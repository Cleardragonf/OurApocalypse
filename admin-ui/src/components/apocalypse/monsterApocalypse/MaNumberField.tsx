import { TextField } from "@mui/material";
import { numberValue } from "../../../utils/number";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function MaNumberField({ label, value, onChange, min, max, step }: Props) {
  return (
    <TextField
      fullWidth
      type="number"
      label={label}
      value={value}
      inputProps={{ min, max, step }}
      onChange={(event) => onChange(numberValue(event.target.value, value))}
    />
  );
}

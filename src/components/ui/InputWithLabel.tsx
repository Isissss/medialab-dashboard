import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HTMLInputTypeAttribute } from "react";

export function InputWithLabel({
  id,
  inputType,
  placeholder,
  label,
  description,
  value,
  onChange,
}: {
  inputType: HTMLInputTypeAttribute;
  id: string;
  placeholder?: string;
  label: string;
  value: string;
  description?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        type={inputType}
        name={id}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
      />
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}

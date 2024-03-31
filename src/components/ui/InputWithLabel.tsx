import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HTMLInputTypeAttribute } from "react";

export function InputWithLabel({
  id,
  inputType,
  placeholder = undefined,
  label,
  description,
  value,
  onChange,
  required = false,
}: {
  inputType: HTMLInputTypeAttribute;
  id: string;
  placeholder?: string | undefined;
  label: string;
  value: string;
  description?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (  
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        type={inputType}
        name={id}
        required={required}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
      />
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
    </div>
  );
}

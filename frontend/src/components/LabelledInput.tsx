import { HTMLInputTypeAttribute, ReactNode } from "react";

export default function LabelledInput({
  children,
  id,
  type = "text",
  placeholder,
}: {
  children: ReactNode;
  id?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <label
      className="label flex flex-col content-start flex-shrink"
      htmlFor="username"
    >
      <span className="label-text self-start">{children}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="input input-bordered self-start"
      />
    </label>
  );
}

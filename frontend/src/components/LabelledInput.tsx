import {
  ChangeEvent,
  HTMLInputTypeAttribute,
  KeyboardEvent,
  ReactNode,
  useCallback,
} from "react";

export default function LabelledInput({
  children,
  id,
  type = "text",
  placeholder,
  onChange: onChangeCallback,
  onSubmit,
}: {
  children: ReactNode;
  id?: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  onChange?: (_value: string) => void;
  onSubmit?: () => void;
}) {
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onChangeCallback && onChangeCallback(event.target.value),
    [onChangeCallback],
  );
  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      event.key === "Enter" && onSubmit && onSubmit();
    },
    [onSubmit],
  );

  return (
    <label
      className="label flex flex-col content-start flex-shrink"
      htmlFor="username"
    >
      <span className="label-text self-start">{children}</span>
      <input
        id={id}
        type={type}
        onChange={onChange}
        placeholder={placeholder}
        className="input input-bordered self-start"
        onSubmit={onSubmit}
        onKeyUp={onEnter}
      />
    </label>
  );
}

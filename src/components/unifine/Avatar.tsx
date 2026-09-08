import { initials } from "./utils";

export function Avatar({
  name,
  color,
  size = 40,
  ring = false,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ${
        ring ? "ring-3 ring-white/80" : ""
      }`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

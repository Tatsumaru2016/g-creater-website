import { Volume2, VolumeX } from "lucide-react";

interface MinigameSoundToggleProps {
  on: boolean;
  onToggle: () => void;
  labelOn: string;
  labelOff: string;
}

export function MinigameSoundToggle({
  on,
  onToggle,
  labelOn,
  labelOff,
}: MinigameSoundToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`pointer-events-auto shrink-0 leading-none transition-colors ${
        on
          ? "text-cyan-400 hover:text-cyan-300"
          : "text-gray-600 hover:text-gray-400"
      }`}
      aria-pressed={on}
      aria-label={on ? labelOn : labelOff}
      title={on ? labelOn : labelOff}
    >
      {on ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
    </button>
  );
}

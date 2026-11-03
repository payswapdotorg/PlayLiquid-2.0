import { cn } from "@/components/lib/utils.js";

/** PlayLiquid ProductMark：液滴标志（24×24 viewBox，深色徽章上的品牌青 #2dd4bf）。 */
export function ZCodeAboutLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2.4c3.5 3.9 6.4 7.2 6.4 10.6a6.4 6.4 0 1 1-12.8 0C5.6 9.6 8.5 6.3 12 2.4Z"
        fill="#2dd4bf"
        fillOpacity="0.16"
        stroke="#2dd4bf"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 13.4c.2 2 1.6 3.3 3.5 3.5"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * PlayLiquid 字标：液滴 ProductMark + "PlayLiquid" 文字。
 * 液滴取主题品牌色（浅色 #0d9488 / 深色 #2dd4bf），文字沿用 currentColor 跟随宿主前景色。
 */
export function ZCodeWordmarkLogo({ className }: { className?: string }) {
  return (
    <svg
      width="244"
      height="54"
      viewBox="0 0 244 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(0 5.2) scale(2)">
        <path
          d="M12 2.4c3.5 3.9 6.4 7.2 6.4 10.6a6.4 6.4 0 1 1-12.8 0C5.6 9.6 8.5 6.3 12 2.4Z"
          style={{
            fill: "var(--color-brand, #2dd4bf)",
            fillOpacity: 0.16,
            stroke: "var(--color-brand, #2dd4bf)",
            strokeWidth: 1.4,
            strokeLinejoin: "round",
          }}
        />
        <path
          d="M9.2 13.4c.2 2 1.6 3.3 3.5 3.5"
          style={{
            fill: "none",
            stroke: "var(--color-brand, #2dd4bf)",
            strokeWidth: 1.2,
            strokeLinecap: "round",
          }}
        />
      </g>
      <text
        x="46"
        y="37"
        fontFamily='Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        fontSize="34"
        fontWeight={600}
        letterSpacing="-0.5"
        fill="currentColor"
      >
        PlayLiquid
      </text>
    </svg>
  );
}

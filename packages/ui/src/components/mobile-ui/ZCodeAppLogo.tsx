import type { ZCodeAppLogoProps } from "@/components/mobile-ui/contract.js";
import { cn } from "@/components/lib/utils.js";

/**
 * 桌面端标题栏左上角同款应用 logo（圆角方块 + PlayLiquid 液滴，自带底色，深浅主题通用）。
 * 装饰性图片：调用方负责在旁边给出可读的品牌文字，避免屏幕阅读器重复朗读。
 */
export function ZCodeAppLogo({ className }: ZCodeAppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      // 稳定的测试/E2E 钩子：打包器可能把 SVG 内联为 data URL，不能靠文件名断言。
      data-app-logo="zcode"
      className={cn("shrink-0 select-none object-contain", className)}
    >
      <defs>
        <linearGradient
          id="playliquid-app-logo-bg"
          x1="12"
          y1="23.25"
          x2="12"
          y2="0.75"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0d1524" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="22.5"
        height="22.5"
        rx="5.25"
        fill="url(#playliquid-app-logo-bg)"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="0.5"
      />
      <g transform="translate(2.4 3.28) scale(0.8)">
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
      </g>
    </svg>
  );
}

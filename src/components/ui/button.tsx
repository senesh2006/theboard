"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Framer Icon Slide Button
 * https://framer.com/m/Icon-Slide-Button-hI1K.js@BlXVznZMyTHRAdKvNiKy
 */
const transition = {
  duration: 0.4,
  ease: [0.44, 0, 0.56, 1] as const,
};

const MotionLink = motion.create(Link);

function ArrowIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

type VariantTheme = {
  bgColor: string;
  bgHoverColor: string;
  textColor: string;
  textHoverColor: string;
  fillColor: string;
  iconColor: string;
  iconHoverColor: string;
  border?: string;
};

const variantThemes: Record<"primary" | "secondary" | "ghost", VariantTheme> = {
  primary: {
    bgColor: "rgb(79, 70, 229)",
    bgHoverColor: "rgb(49, 46, 129)",
    textColor: "rgb(255, 255, 255)",
    textHoverColor: "rgb(255, 255, 255)",
    fillColor: "rgb(67, 56, 202)",
    iconColor: "rgb(199, 210, 254)",
    iconHoverColor: "rgb(255, 255, 255)",
  },
  secondary: {
    bgColor: "rgba(15, 23, 42, 0.72)",
    bgHoverColor: "rgb(30, 41, 59)",
    textColor: "rgb(226, 232, 240)",
    textHoverColor: "rgb(255, 255, 255)",
    fillColor: "rgb(51, 65, 85)",
    iconColor: "rgb(148, 163, 184)",
    iconHoverColor: "rgb(255, 255, 255)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  ghost: {
    bgColor: "transparent",
    bgHoverColor: "rgba(30, 41, 59, 0.55)",
    textColor: "rgb(203, 213, 225)",
    textHoverColor: "rgb(255, 255, 255)",
    fillColor: "rgba(51, 65, 85, 0.65)",
    iconColor: "rgb(148, 163, 184)",
    iconHoverColor: "rgb(255, 255, 255)",
  },
};

const sizeStyles = {
  sm: { fontSize: 14, padY: 9, padX: 16, iconPad: 14, height: 36 },
  md: { fontSize: 14, padY: 10, padX: 20, iconPad: 16, height: 40 },
  lg: { fontSize: 16, padY: 11, padX: 24, iconPad: 18, height: 44 },
};

type ButtonProps = Omit<HTMLMotionProps<"button">, "color" | "children"> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  children?: React.ReactNode;
};

function IconSlideContent({
  theme,
  sizing,
  children,
}: {
  theme: VariantTheme;
  sizing: (typeof sizeStyles)["md"];
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.span
        variants={{
          idle: {
            color: theme.textColor,
            paddingLeft: sizing.padX,
            paddingRight: sizing.padX,
          },
          hover: {
            color: theme.textHoverColor,
            paddingLeft: sizing.padX - 4,
            paddingRight: 0,
          },
        }}
        transition={transition}
        style={{
          position: "relative",
          zIndex: 2,
          fontSize: sizing.fontSize,
          fontWeight: 500,
          whiteSpace: "nowrap",
          lineHeight: 1,
          paddingTop: sizing.padY,
          paddingBottom: sizing.padY,
        }}
      >
        {children}
      </motion.span>

      <motion.span
        variants={{
          idle: { opacity: 0, width: 0, marginRight: 0 },
          hover: {
            opacity: 1,
            width: sizing.fontSize + 4,
            marginRight: sizing.iconPad,
          },
        }}
        transition={transition}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <motion.span
          variants={{
            idle: { x: -12, color: theme.iconColor },
            hover: { x: 0, color: theme.iconHoverColor },
          }}
          transition={transition}
          style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <ArrowIcon size={sizing.fontSize} />
        </motion.span>
      </motion.span>

      <motion.span
        variants={{
          idle: { scale: 0, opacity: 0 },
          hover: { scale: 1, opacity: 1 },
        }}
        transition={transition}
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          bottom: 10,
          width: 30,
          zIndex: 1,
          borderRadius: 999,
          backgroundColor: theme.fillColor,
          transformOrigin: "center center",
        }}
        aria-hidden
      />
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  type = "button",
  href,
  ...props
}: ButtonProps) {
  const theme = variantThemes[variant];
  const sizing = sizeStyles[size];

  const sharedClassName = cn(
    "icon-slide-btn relative inline-flex items-center justify-center overflow-hidden font-medium no-underline disabled:pointer-events-none disabled:opacity-50",
    className,
  );

  const sharedStyle = {
    borderRadius: "999px",
    border: theme.border,
    minHeight: sizing.height,
  };

  if (href && !disabled) {
    return (
      <MotionLink
        href={href}
        initial="idle"
        whileHover="hover"
        whileTap={{ scale: 0.97 }}
        variants={{
          idle: { backgroundColor: theme.bgColor },
          hover: { backgroundColor: theme.bgHoverColor },
        }}
        transition={transition}
        className={sharedClassName}
        style={sharedStyle}
      >
        <IconSlideContent theme={theme} sizing={sizing}>
          {children}
        </IconSlideContent>
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      initial="idle"
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      variants={{
        idle: { backgroundColor: theme.bgColor },
        hover: { backgroundColor: theme.bgHoverColor },
      }}
      transition={transition}
      className={sharedClassName}
      style={sharedStyle}
      {...props}
    >
      <IconSlideContent theme={theme} sizing={sizing}>
        {children}
      </IconSlideContent>
    </motion.button>
  );
}

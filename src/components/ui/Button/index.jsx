// Import Dependencies
import PropTypes from "prop-types";
import { forwardRef } from "react";
import clsx from 'clsx'

// Local Imports
import { COLORS } from "constants/app.constant";
import { setThisClass } from "utils/setThisClass";

// ----------------------------------------------------------------------

const variants = {
  filled:
    "bg-this text-white hover:bg-this-darker focus:bg-this-darker active:bg-this-darker/90 disabled:bg-this-light dark:disabled:bg-this-darker",
  soft: "text-this-darker bg-this-darker/[.08] hover:bg-this-darker/[.15] focus:bg-this-darker/[.15] active:focus:bg-this-darker/20 dark:bg-this-lighter/10 dark:text-this-lighter dark:hover:bg-this-lighter/20 dark:focus:bg-this-lighter/20 dark:active:bg-this-lighter/25",
  outlined:
    "text-this-darker border border-this-darker hover:bg-this-darker/[.05] focus:bg-this-darker/[.05] active:bg-this-darker/10 dark:border-this-lighter dark:text-this-lighter dark:hover:bg-this-lighter/[.05] dark:focus:bg-this-lighter/[.05] dark:active:bg-this-lighter/10",
  flat: "text-this-darker hover:bg-this-darker/[.08] focus:bg-this-darker/[.08] active:bg-this-darker/[.15] dark:text-this-lighter dark:hover:bg-this-lighter/10 dark:focus:bg-this-lighter/10 dark:active:bg-this-lighter/[.15]",
};

const neutralVariants = {
  filled:
    "bg-gray-150 text-gray-900 hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-200/80 dark:bg-surface-2 dark:text-dark-50 dark:hover:bg-surface-1 dark:focus:bg-surface-1 dark:active:bg-surface-1/90",
  soft: "bg-gray-150/30 text-gray-900 hover:bg-gray-200/[.15] focus:bg-gray-200/[.15] active:bg-gray-200/20 dark:bg-dark-500/30 dark:text-dark-50 dark:hover:bg-dark-450/[.15] dark:focus:bg-dark-450/[.15] dark:active:bg-dark-450/20",
  outlined:
    "border border-gray-300 hover:bg-gray-300/20 focus:bg-gray-300/20 text-gray-900 active:bg-gray-300/25 dark:text-dark-50 dark:hover:bg-dark-300/20 dark:focus:bg-dark-300/20 dark:active:bg-dark-300/25 dark:border-dark-450",
  flat: "hover:bg-gray-300/20 focus:bg-gray-300/20 text-gray-700 active:bg-gray-300/25 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:focus:bg-dark-300/10 dark:active:bg-dark-300/20",
};

const colorVariants = {
  primary: {
    filled:
      "bg-primary-600 text-white hover:bg-primary-700 focus:bg-primary-700 active:bg-primary-700/90 disabled:bg-primary-500 dark:disabled:bg-primary-700",
    soft: "bg-primary-700/[.08] text-primary-700 hover:bg-primary-700/[.15] focus:bg-primary-700/[.15] active:bg-primary-700/20 dark:bg-primary-400/10 dark:text-primary-400 dark:hover:bg-primary-400/20 dark:focus:bg-primary-400/20 dark:active:bg-primary-400/25",
    outlined:
      "border border-primary-700 text-primary-700 hover:bg-primary-700/[.05] focus:bg-primary-700/[.05] active:bg-primary-700/10 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-400/[.05] dark:focus:bg-primary-400/[.05] dark:active:bg-primary-400/10",
    flat: "text-primary-700 hover:bg-primary-700/[.08] focus:bg-primary-700/[.08] active:bg-primary-700/[.15] dark:text-primary-400 dark:hover:bg-primary-400/10 dark:focus:bg-primary-400/10 dark:active:bg-primary-400/[.15]",
  },
  secondary: {
    filled:
      "bg-secondary text-white hover:bg-secondary-darker focus:bg-secondary-darker active:bg-secondary-darker/90 disabled:bg-secondary-light dark:disabled:bg-secondary-darker",
    soft: "bg-secondary-darker/[.08] text-secondary-darker hover:bg-secondary-darker/[.15] focus:bg-secondary-darker/[.15] active:bg-secondary-darker/20 dark:bg-secondary-lighter/10 dark:text-secondary-lighter dark:hover:bg-secondary-lighter/20 dark:focus:bg-secondary-lighter/20 dark:active:bg-secondary-lighter/25",
    outlined:
      "border border-secondary-darker text-secondary-darker hover:bg-secondary-darker/[.05] focus:bg-secondary-darker/[.05] active:bg-secondary-darker/10 dark:border-secondary-lighter dark:text-secondary-lighter dark:hover:bg-secondary-lighter/[.05] dark:focus:bg-secondary-lighter/[.05] dark:active:bg-secondary-lighter/10",
    flat: "text-secondary-darker hover:bg-secondary-darker/[.08] focus:bg-secondary-darker/[.08] active:bg-secondary-darker/[.15] dark:text-secondary-lighter dark:hover:bg-secondary-lighter/10 dark:focus:bg-secondary-lighter/10 dark:active:bg-secondary-lighter/[.15]",
  },
  info: {
    filled:
      "bg-info text-white hover:bg-info-darker focus:bg-info-darker active:bg-info-darker/90 disabled:bg-info-light dark:disabled:bg-info-darker",
    soft: "bg-info-darker/[.08] text-info-darker hover:bg-info-darker/[.15] focus:bg-info-darker/[.15] active:bg-info-darker/20 dark:bg-info-lighter/10 dark:text-info-lighter dark:hover:bg-info-lighter/20 dark:focus:bg-info-lighter/20 dark:active:bg-info-lighter/25",
    outlined:
      "border border-info-darker text-info-darker hover:bg-info-darker/[.05] focus:bg-info-darker/[.05] active:bg-info-darker/10 dark:border-info-lighter dark:text-info-lighter dark:hover:bg-info-lighter/[.05] dark:focus:bg-info-lighter/[.05] dark:active:bg-info-lighter/10",
    flat: "text-info-darker hover:bg-info-darker/[.08] focus:bg-info-darker/[.08] active:bg-info-darker/[.15] dark:text-info-lighter dark:hover:bg-info-lighter/10 dark:focus:bg-info-lighter/10 dark:active:bg-info-lighter/[.15]",
  },
  success: {
    filled:
      "bg-success text-white hover:bg-success-darker focus:bg-success-darker active:bg-success-darker/90 disabled:bg-success-light dark:disabled:bg-success-darker",
    soft: "bg-success-darker/[.08] text-success-darker hover:bg-success-darker/[.15] focus:bg-success-darker/[.15] active:bg-success-darker/20 dark:bg-success-lighter/10 dark:text-success-lighter dark:hover:bg-success-lighter/20 dark:focus:bg-success-lighter/20 dark:active:bg-success-lighter/25",
    outlined:
      "border border-success-darker text-success-darker hover:bg-success-darker/[.05] focus:bg-success-darker/[.05] active:bg-success-darker/10 dark:border-success-lighter dark:text-success-lighter dark:hover:bg-success-lighter/[.05] dark:focus:bg-success-lighter/[.05] dark:active:bg-success-lighter/10",
    flat: "text-success-darker hover:bg-success-darker/[.08] focus:bg-success-darker/[.08] active:bg-success-darker/[.15] dark:text-success-lighter dark:hover:bg-success-lighter/10 dark:focus:bg-success-lighter/10 dark:active:bg-success-lighter/[.15]",
  },
  warning: {
    filled:
      "bg-warning text-white hover:bg-warning-darker focus:bg-warning-darker active:bg-warning-darker/90 disabled:bg-warning-light dark:disabled:bg-warning-darker",
    soft: "bg-warning-darker/[.08] text-warning-darker hover:bg-warning-darker/[.15] focus:bg-warning-darker/[.15] active:bg-warning-darker/20 dark:bg-warning-lighter/10 dark:text-warning-lighter dark:hover:bg-warning-lighter/20 dark:focus:bg-warning-lighter/20 dark:active:bg-warning-lighter/25",
    outlined:
      "border border-warning-darker text-warning-darker hover:bg-warning-darker/[.05] focus:bg-warning-darker/[.05] active:bg-warning-darker/10 dark:border-warning-lighter dark:text-warning-lighter dark:hover:bg-warning-lighter/[.05] dark:focus:bg-warning-lighter/[.05] dark:active:bg-warning-lighter/10",
    flat: "text-warning-darker hover:bg-warning-darker/[.08] focus:bg-warning-darker/[.08] active:bg-warning-darker/[.15] dark:text-warning-lighter dark:hover:bg-warning-lighter/10 dark:focus:bg-warning-lighter/10 dark:active:bg-warning-lighter/[.15]",
  },
  error: {
    filled:
      "bg-error text-white hover:bg-error-darker focus:bg-error-darker active:bg-error-darker/90 disabled:bg-error-light dark:disabled:bg-error-darker",
    soft: "bg-error-darker/[.08] text-error-darker hover:bg-error-darker/[.15] focus:bg-error-darker/[.15] active:bg-error-darker/20 dark:bg-error-lighter/10 dark:text-error-lighter dark:hover:bg-error-lighter/20 dark:focus:bg-error-lighter/20 dark:active:bg-error-lighter/25",
    outlined:
      "border border-error-darker text-error-darker hover:bg-error-darker/[.05] focus:bg-error-darker/[.05] active:bg-error-darker/10 dark:border-error-lighter dark:text-error-lighter dark:hover:bg-error-lighter/[.05] dark:focus:bg-error-lighter/[.05] dark:active:bg-error-lighter/10",
    flat: "text-error-darker hover:bg-error-darker/[.08] focus:bg-error-darker/[.08] active:bg-error-darker/[.15] dark:text-error-lighter dark:hover:bg-error-lighter/10 dark:focus:bg-error-lighter/10 dark:active:bg-error-lighter/[.15]",
  },
};

const Button = forwardRef((props, ref) => {
  const {
    component,
    className,
    children,
    color,
    isIcon,
    variant: inputVariant = "filled",
    unstyled,
    type = "button",
    isGlow,
    disabled,
    loading,
    onClick,
    ...rest
  } = props;

  const variant = inputVariant === "outline" ? "outlined" : inputVariant;
  const Component = component || "button";
  const mergedColor = color || "neutral";

  return (
    <Component
      className={clsx(
        "btn-base",
        !unstyled
          ? [
              "btn",
              isIcon && "shrink-0 p-0",
              mergedColor === "neutral"
                ? [
                    neutralVariants[variant],
                    isGlow &&
                      "shadow-lg shadow-gray-200/50 dark:shadow-dark-450/5",
                  ]
                : [
                    setThisClass(mergedColor),
                    colorVariants[mergedColor]?.[variant] ?? variants[variant],
                    isGlow &&
                      "shadow-soft shadow-this/50 dark:shadow-lg dark:shadow-this/50",
                  ],
            ]
          : color && color !== "neutral" && setThisClass(color),
        className,
      )}
      type={type}
      ref={ref}
      disabled={disabled || loading}
      data-disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Component>
  );
});

Button.displayName = "Button";

Button.propTypes = {
  children: PropTypes.node,
  component: PropTypes.elementType,
  className: PropTypes.string,
  type: PropTypes.string,
  isIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  color: PropTypes.oneOf(COLORS),
  variant: PropTypes.oneOf(["filled", "outlined", "soft", "flat", "outline"]),
  unstyled: PropTypes.bool,
  isGlow: PropTypes.bool,
};

export { Button };

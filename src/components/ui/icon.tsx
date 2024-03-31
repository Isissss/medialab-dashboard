import clsx from "clsx";
import { PropsWithChildren, Ref, forwardRef } from "react";

interface BaseProps {
  className: string
  [key: string]: unknown
}

export const Icon = forwardRef(
  (
    { className, ...props }: PropsWithChildren<BaseProps>,
    ref: Ref<HTMLSpanElement>
  ) => (
    <span
      {...props}
      ref={ref}
      className={clsx(
        'material-icons',
        className,
        "text-sm align-bottom"
      )}
    />
  )
)

export function PageHeader({
  title,
  subtitle,
  actions,
}) {
  const hasHeading = Boolean(title || subtitle);
  return (
    <div className={`flex flex-row items-center justify-between gap-2 sm:gap-3 sm:items-end ${hasHeading ? "mb-3 sm:mb-6" : "mb-3.5 sm:mb-6"}`}>
      {hasHeading && (
        <div className="min-w-0 flex-1">
          {title && <h1 className="text-xl sm:text-2xl font-bold tracking-tight md:text-3xl truncate">{title}</h1>}
          {subtitle && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {actions && <div className="w-auto shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

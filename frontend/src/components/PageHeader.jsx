export function PageHeader({
  title,
  subtitle,
  actions,
}) {
  const hasHeading = Boolean(title || subtitle);
  return (
    <div className={`flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-end sm:justify-between ${hasHeading ? "mb-3 sm:mb-6" : "mb-3.5 sm:mb-6"}`}>
      {hasHeading && (
        <div>
          {title && <h1 className="text-xl sm:text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>}
          {subtitle && <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {actions && <div className="w-full sm:w-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

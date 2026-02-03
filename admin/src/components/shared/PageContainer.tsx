import { cn } from "@/lib/utils";

interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  actions,
  children,
  className,
  headerContent,
}: PageContainerProps) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 sm:px-6 lg:px-8">
        {(title || headerContent) && (
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm sm:text-base text-muted-foreground">
                  {description}
                </p>
              )}
              {headerContent}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

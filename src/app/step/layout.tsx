import { StepRail } from "@/components/layout/StepRail";

export default function StepLayout({ children }: LayoutProps<"/step">) {
  return (
    <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-3.5 rail:grid-cols-[220px_minmax(0,1fr)] rail:gap-7">
      <StepRail />
      <main id="main" className="min-w-0">
        {children}
      </main>
    </div>
  );
}

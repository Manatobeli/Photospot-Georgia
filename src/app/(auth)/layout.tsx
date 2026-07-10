export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-brand-gradient-soft px-4 py-12 dark:bg-neutral-950">
      <div className="absolute inset-0 bg-brand-gradient opacity-[0.05] dark:opacity-[0.1]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

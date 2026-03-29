export function Provider({ children }: { children: React.ReactNode }) {
  // Can add other global providers here if needed in the future
  return (
    <>
      {children}
    </>
  );
}

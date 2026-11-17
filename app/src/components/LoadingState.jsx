export default function LoadingState({ className = "flex items-center justify-center h-64", dark = false }) {
  return (
    <div className={className}>
      <div className={`w-8 h-8 border-4 rounded-full animate-spin ${dark ? "border-white/10 border-t-orange-500" : "border-primary/20 border-t-primary"}`} />
    </div>
  );
}
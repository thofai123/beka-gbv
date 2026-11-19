import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, backTo, children }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (backTo) {
      navigate(backTo, { replace: true });
    } else {
      navigate("/beka/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-md shadow-primary/20">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}

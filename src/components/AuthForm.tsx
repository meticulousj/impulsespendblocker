import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export function AuthForm() {
  const { signIn, signUp, sendEmailCode, verifyEmailCode } = useAuth();
  const [mode, setMode] = useState<"password" | "code">("code");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fn = isSignUp ? signUp : signIn;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (isSignUp) {
      toast.success("Check your email to confirm your account!");
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await sendEmailCode(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setCodeSent(true);
      toast.success("Code sent — check your email");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await verifyEmailCode(email, code.trim());
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  const inputClass = "field-input";

  return (
    <div className="bento-tile p-6 space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold">
          {mode === "code" ? "Sign in with email code" : isSignUp ? "Create an account" : "Sign in"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "code"
            ? "We'll email you a 6-digit code — no password needed"
            : isSignUp
              ? "Sign up to save your purchase history"
              : "Sign in to track your spending decisions"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("code")}
          className={`rounded-lg py-2 transition-colors ${mode === "code" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Email code
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-lg py-2 transition-colors ${mode === "password" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Password
        </button>
      </div>

      {mode === "code" ? (
        codeSent ? (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className={`${inputClass} text-center text-lg tracking-[0.5em] font-mono`}
              required
              minLength={6}
              maxLength={6}
            />
            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-12 rounded-xl bg-gradient-ink text-sm font-semibold shadow-lift transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-ink text-sm font-semibold shadow-lift transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send sign-in code
                </span>
              )}
            </Button>
          </form>
        )
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={inputClass}
            required
            minLength={6}
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-ink text-sm font-semibold shadow-lift transition-all duration-200 hover:opacity-95 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              "Sign up"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      )}

      {mode === "password" && (
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      )}
    </div>
  );
}

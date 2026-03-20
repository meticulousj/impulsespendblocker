import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {isSignUp ? "Create an account" : "Sign in"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isSignUp
            ? "Sign up to save your purchase history"
            : "Sign in to track your spending decisions"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          className="w-full h-11 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
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

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
      </button>
    </div>
  );
}

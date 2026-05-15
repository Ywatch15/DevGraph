"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthUI } from "@/components/ui/auth-fuse";
import toast from "react-hot-toast";

function LoginInner() {
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams?.get("redirect") || "/dashboard";

  const handleSignIn = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome to DevGraph");
      router.push(redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <AuthUI
      initialMode="signin"
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      loading={loading}
      signInContent={{
        quote: {
          text: "Your developer second brain awaits.",
          author: "DevGraph",
        },
      }}
      signUpContent={{
        quote: {
          text: "Start building your knowledge graph today.",
          author: "DevGraph",
        },
      }}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--color-bg-base)" }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

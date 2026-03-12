"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthUI } from "@/components/ui/auth-fuse";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
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
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome to DevGraph");
      router.push("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      const message =
        (Array.isArray(data?.details) && data.details[0]) ||
        data?.error ||
        "Registration failed";
      toast.error(message);
    }
    setLoading(false);
  };

  return (
    <AuthUI
      initialMode="signup"
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

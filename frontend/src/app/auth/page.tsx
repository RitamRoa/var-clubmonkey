import AuthPage from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ClubMonkey",
  description: "Sign in to your ClubMonkey account",
};

export default function Page() {
  return <AuthPage />;
}

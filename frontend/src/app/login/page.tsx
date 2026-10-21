import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Portal Login – Dexar Technologies",
  description: "Sign in to access your Dexar LMS learning courses, live meetings, and coding arena.",
};

export default function LoginPage() {
  return (
    <div className="login-scope flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 sm:p-6 md:p-10 text-[#0f172a] antialiased">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}

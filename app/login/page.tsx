import { LoginForm } from "@/components/login/LoginForm";
import { LoginPanel } from "@/components/login/LoginPanel";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-[#FBF4EC]">
      <LoginPanel />
      <div className="flex items-center justify-center p-10">
        <LoginForm />
      </div>
    </div>
  );
}

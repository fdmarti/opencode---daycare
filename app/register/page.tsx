import { RegisterForm } from "@/components/register/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-110">
        <RegisterForm />
      </div>
    </div>
  );
}

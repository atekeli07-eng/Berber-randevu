import { SignupForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";

export default function SignupPage() {
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        <SignupForm />
      </main>
    </div>
  );
}

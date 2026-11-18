import { ResetForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";

export default function ResetPage() {
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        <ResetForm />
      </main>
    </div>
  );
}

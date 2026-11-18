import { LoginForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ yapilandirma?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        <LoginForm missingConfig={params.yapilandirma === "1"} />
      </main>
    </div>
  );
}

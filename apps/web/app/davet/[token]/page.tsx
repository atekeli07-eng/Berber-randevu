import { AcceptInvite } from "@/components/accept-invite";
import { PublicHeader } from "@/components/public-header";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-serif text-4xl">Davet hazır değil.</h1>
      </main>
    );
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_staff_invite", { p_token: token });
  const invite = data as { email?: string; staff_name?: string; salon_name?: string; accepted?: boolean } | null;
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        {invite?.email ? (
          <AcceptInvite token={token} email={invite.email} salonName={invite.salon_name ?? "Salon"} staffName={invite.staff_name ?? "Personel"} accepted={Boolean(invite.accepted)} />
        ) : (
          <h1 className="font-serif text-4xl">Davet bulunamadı.</h1>
        )}
      </main>
    </div>
  );
}

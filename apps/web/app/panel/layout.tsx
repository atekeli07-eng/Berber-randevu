import { PanelShell } from "@/components/panel-shell";
import { getAccessContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { salon, email, role } = await getAccessContext();
  return (
    <PanelShell salon={salon} email={email} role={role}>
      {children}
    </PanelShell>
  );
}

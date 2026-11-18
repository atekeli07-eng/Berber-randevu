import { PanelShell } from "@/components/panel-shell";
import { getOwnerContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { salon, email } = await getOwnerContext();
  return (
    <PanelShell salon={salon} email={email}>
      {children}
    </PanelShell>
  );
}

import { SalonForm } from "@/components/salon-form";
import { getOwnerContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function SalonPage() {
  const { salon } = await getOwnerContext();
  return <SalonForm salon={salon} />;
}

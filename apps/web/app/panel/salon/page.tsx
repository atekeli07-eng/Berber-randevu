import { EraseCustomer } from "@/components/erase-customer";
import { SalonForm } from "@/components/salon-form";
import { requireOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function SalonPage() {
  const { salon } = await requireOwner();
  return (
    <div className="space-y-6">
      <SalonForm salon={salon} />
      <div className="rounded-3xl border border-line bg-card p-5">
        <EraseCustomer />
      </div>
    </div>
  );
}

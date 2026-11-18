import { BillingSettingsForm } from "@/components/admin-controls";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  const price = Number(data?.monthly_price_kurus ?? 0) / 100;
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">Ücret ve IBAN</h1>
      <p className="text-sm text-muted">
        Deneme günü yalnızca bundan sonra açılan salonlara uygulanır. Mevcut salonların denemesi değişmez.
      </p>
      <Card>
        <BillingSettingsForm
          priceTl={String(price)}
          iban={String(data?.iban ?? "")}
          holder={String(data?.account_holder ?? "")}
          bank={String(data?.bank_name ?? "")}
          trialDays={String(data?.trial_days ?? 30)}
        />
      </Card>
    </div>
  );
}

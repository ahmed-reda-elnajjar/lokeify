import { endMerchantSession } from "@/server/auth";
import { ok } from "@/server/http";

export async function POST() {
  await endMerchantSession();
  return ok();
}

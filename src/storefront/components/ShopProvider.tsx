"use client";

import type { ReactNode } from "react";
import { ShopContext, type ShopBoot } from "@/storefront/lib/context";
import { hydrateStore } from "@/storefront/lib/store";
import { Overlays } from "./Overlays";

/** Wraps every storefront page: hands the server's data to the store and adds the bag, fit room and toast. */
export function ShopProvider({ boot, children }: { boot: ShopBoot; children: ReactNode }) {
  hydrateStore(boot);
  return (
    <ShopContext.Provider value={boot}>
      {children}
      <Overlays />
    </ShopContext.Provider>
  );
}

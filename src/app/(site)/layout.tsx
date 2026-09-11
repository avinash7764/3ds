import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/server/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

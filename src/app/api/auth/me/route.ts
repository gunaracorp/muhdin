import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ user: null });
  return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive } });
}

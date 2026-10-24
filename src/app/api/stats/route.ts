import { db } from "@/lib/db";
import { guardAdmin, ok } from "@/lib/api-helpers";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const [articles, tutorials, members, pendingMembers, unreadMessages, pendingApplications, unreadComplaints, subscribers, testimonials, faqs, ecosystemCount] =
    await Promise.all([
      db.article.count(),
      db.tutorial.count(),
      db.member.count(),
      db.member.count({ where: { status: "PENDING" } }),
      db.contactMessage.count({ where: { status: "UNREAD" } }),
      db.membershipApplication.count({ where: { status: "PENDING" } }),
      db.complaint.count({ where: { status: "UNREAD" } }), // Task 18
      db.subscriber.count(), // Task 18
      db.testimonial.count(),
      db.faq.count(),
      db.ecosystem.count(),
    ]);

  const articlesList = await db.article.findMany({ select: { views: true, category: true } });
  const tutorialsViews = await db.tutorial.aggregate({ _sum: { views: true } });
  const totalViews = articlesList.reduce((s, a) => s + a.views, 0) + (tutorialsViews._sum.views || 0);

  const categoryMap = new Map<string, number>();
  articlesList.forEach((a) => categoryMap.set(a.category, (categoryMap.get(a.category) || 0) + 1));
  const byCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));

  const memberByType = await db.member.groupBy({ by: ["type"], _count: { type: true } });

  const [recentMessages, recentApplications] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.membershipApplication.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return ok({
    articles,
    tutorials,
    members,
    pendingMembers,
    unreadMessages,
    pendingApplications,
    unreadComplaints, // Task 18
    subscribers, // Task 18
    testimonials,
    faqs,
    ecosystems: ecosystemCount,
    totalViews,
    byCategory,
    memberByType: memberByType.map((m) => ({ type: m.type, count: m._count.type })),
    recentMessages,
    recentApplications,
  });
}

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "./prisma.ts";
import { createNotification, getUnreadNotificationCount, getNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications.ts";
import { createTestCohort, createTestFounder, cleanupTestData, testRunId } from "./test-db.ts";

describe("notifications", () => {
  const runId = testRunId("notif");
  const slug = `notif-${runId}`;
  let cohortId: string;
  let userId: string;

  before(async () => {
    const cohort = await createTestCohort(slug);
    cohortId = cohort.id;
    const user = await createTestFounder({ cohortId, email: `notif-${runId}@test.com`, name: "Notif Tester" });
    userId = user.id;
  });

  after(async () => {
    await cleanupTestData({ cohortSlugs: [slug], emails: [`notif-${runId}@test.com`] });
  });

  it("creates a notification", async () => {
    const n = await createNotification({
      userId,
      type: "targeted_request",
      title: "Someone asked about CRM",
      body: "Can you share more about your experience?",
      link: "/requests",
    });

    assert.ok(n.id);
    assert.equal(n.type, "targeted_request");
    assert.equal(n.title, "Someone asked about CRM");
    assert.equal(n.body, "Can you share more about your experience?");
    assert.equal(n.link, "/requests");
    assert.equal(n.readAt, null);
  });

  it("getUnreadNotificationCount returns unread count", async () => {
    await createNotification({ userId, type: "exchange_request", title: "Guest post request", link: "/exchanges" });
    await createNotification({ userId, type: "badge_earned", title: "Badge earned" });
    const count = await getUnreadNotificationCount(userId);
    assert.equal(count, 3); // 2 new + 1 from previous test
  });

  it("getNotifications returns most recent first", async () => {
    const all = await getNotifications(userId);
    assert.ok(all.length >= 3);
    // most recent first
    for (let i = 1; i < all.length; i++) {
      assert.ok(all[i - 1].createdAt >= all[i].createdAt);
    }
  });

  it("markNotificationRead marks a single notification read", async () => {
    const [unread] = await prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    await markNotificationRead(unread.id, userId);

    const updated = await prisma.notification.findUnique({ where: { id: unread.id } });
    assert.ok(updated?.readAt);
  });

  it("markAllNotificationsRead marks all read", async () => {
    await markAllNotificationsRead(userId);

    const count = await getUnreadNotificationCount(userId);
    assert.equal(count, 0);
  });
});

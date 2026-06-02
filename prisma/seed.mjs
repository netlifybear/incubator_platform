import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = process.env.DIRECT_DATABASE_URL
  ? new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL })
  : undefined;
const accelerateUrl = !adapter && process.env.DATABASE_URL?.startsWith("prisma")
  ? process.env.DATABASE_URL
  : undefined;

const prisma = new PrismaClient({
  ...(adapter ? { adapter } : {}),
  ...(accelerateUrl ? { accelerateUrl } : {}),
});

function hashIssuerSecret(secret) {
  const pepper =
    process.env.ISSUER_SECRET_PEPPER ??
    process.env.NEXTAUTH_SECRET ??
    "dev-issuer-secret-pepper";
  const digest = crypto
    .createHmac("sha256", pepper)
    .update(secret.trim())
    .digest("base64url");

  return `issuer-secret:v1:${digest}`;
}

async function main() {
  const cohort = await prisma.cohort.upsert({
    where: { slug: "demo-incubator" },
    update: {},
    create: {
      name: "Demo Incubator",
      slug: "demo-incubator",
      description: "A seeded cohort for the private trust loop MVP.",
    },
  });

  const peerCohort = await prisma.cohort.upsert({
    where: { slug: "harbor-accelerator" },
    update: {},
    create: {
      name: "Harbor Accelerator",
      slug: "harbor-accelerator",
      description: "A partner cohort used to demonstrate cross-cohort vendor discovery.",
    },
  });

  const maya = await prisma.user.upsert({
    where: { email: "maya@example.com" },
    update: { cohortId: cohort.id, profileSlug: "maya", role: "founder", publicProfileEnabled: true },
    create: {
      email: "maya@example.com",
      name: "Maya Chen",
      startupUrl: "https://flowdesk.example",
      startupName: "Flow Desk",
      bio: "Founder building workflow software for local service businesses.",
      profileSlug: "maya",
      role: "founder",
      cohortId: cohort.id,
      publicProfileEnabled: true,
      profileCompletePercentage: 80,
    },
  });

  const jordan = await prisma.user.upsert({
    where: { email: "jordan@example.com" },
    update: { cohortId: cohort.id, profileSlug: "jordan", role: "founder", publicProfileEnabled: true },
    create: {
      email: "jordan@example.com",
      name: "Jordan Lee",
      startupUrl: "https://ledgerflow.example",
      startupName: "Ledger Flow",
      bio: "Founder building better finance tooling for independent operators.",
      profileSlug: "jordan",
      role: "founder",
      cohortId: cohort.id,
      publicProfileEnabled: true,
      profileCompletePercentage: 70,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { cohortId: cohort.id, profileSlug: "avery-admin", role: "admin", publicProfileEnabled: false },
    create: {
      email: "admin@example.com",
      name: "Avery Admin",
      bio: "Incubator operator keeping the vendor memory layer healthy.",
      profileSlug: "avery-admin",
      role: "admin",
      cohortId: cohort.id,
      publicProfileEnabled: false,
      profileCompletePercentage: 60,
    },
  });

  const lina = await prisma.user.upsert({
    where: { email: "lina@example.com" },
    update: { cohortId: peerCohort.id, profileSlug: "lina", role: "founder", publicProfileEnabled: true },
    create: {
      email: "lina@example.com",
      name: "Lina Patel",
      startupUrl: "https://harborops.example",
      startupName: "Harbor Ops",
      bio: "Founder building operations tooling for distributed teams.",
      profileSlug: "lina",
      role: "founder",
      cohortId: peerCohort.id,
      publicProfileEnabled: true,
      profileCompletePercentage: 75,
    },
  });

  const omar = await prisma.user.upsert({
    where: { email: "omar@example.com" },
    update: { cohortId: peerCohort.id, profileSlug: "omar", role: "founder", publicProfileEnabled: true },
    create: {
      email: "omar@example.com",
      name: "Omar Rivera",
      startupUrl: "https://fieldledger.example",
      startupName: "Field Ledger",
      bio: "Founder improving finance workflows for field-service companies.",
      profileSlug: "omar",
      role: "founder",
      cohortId: peerCohort.id,
      publicProfileEnabled: true,
      profileCompletePercentage: 70,
    },
  });

  await prisma.user.updateMany({
    where: {
      profileSlug: null,
    },
    data: {
      publicProfileEnabled: false,
    },
  });

  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { id: "demo-vendor-legal" },
      update: {
        badgeAwardSecret: hashIssuerSecret("demo-vendor-award-secret"),
      },
      create: {
        id: "demo-vendor-legal",
        name: "Northstar Startup Counsel",
        category: "Legal",
        contact: "hello@northstar.example",
        badgeAwardSecret: hashIssuerSecret("demo-vendor-award-secret"),
        cohortId: cohort.id,
      },
    }),
    prisma.vendor.upsert({
      where: { id: "demo-vendor-accounting" },
      update: {},
      create: {
        id: "demo-vendor-accounting",
        name: "Ledger Grove Accounting",
        category: "Accounting",
        contact: "team@ledgergrove.example",
        cohortId: cohort.id,
      },
    }),
    prisma.vendor.upsert({
      where: { id: "demo-vendor-design" },
      update: {},
      create: {
        id: "demo-vendor-design",
        name: "Signal & Form Studio",
        category: "Design",
        contact: "studio@signalandform.example",
        cohortId: cohort.id,
      },
    }),
  ]);

  const peerVendors = await Promise.all([
    prisma.vendor.upsert({
      where: { id: "harbor-vendor-legal" },
      update: {},
      create: {
        id: "harbor-vendor-legal",
        name: "Harbor Legal Collective",
        category: "Legal",
        contact: "team@harborlegal.example",
        cohortId: peerCohort.id,
      },
    }),
    prisma.vendor.upsert({
      where: { id: "harbor-vendor-payroll" },
      update: {},
      create: {
        id: "harbor-vendor-payroll",
        name: "Dockside Payroll",
        category: "Payroll",
        contact: "hello@docksidepayroll.example",
        cohortId: peerCohort.id,
      },
    }),
    prisma.vendor.upsert({
      where: { id: "harbor-vendor-design" },
      update: {},
      create: {
        id: "harbor-vendor-design",
        name: "North Pier Design",
        category: "Design",
        contact: "studio@northpier.example",
        cohortId: peerCohort.id,
      },
    }),
  ]);

  await prisma.investor.upsert({
    where: { id: "demo-investor-1" },
    update: {
      badgeAwardSecret: hashIssuerSecret("demo-investor-award-secret"),
    },
    create: {
      id: "demo-investor-1",
      name: "Riley Investor",
      email: "riley-investor@example.com",
      company: "Demo Ventures",
      badgeAwardSecret: hashIssuerSecret("demo-investor-award-secret"),
    },
  });

  await prisma.review.deleteMany({
    where: {
      vendorId: { in: [...vendors.map((v) => v.id), ...peerVendors.map((v) => v.id)] },
    },
  });

  const review1 = await prisma.review.create({
    data: {
      rating: 5,
      comment: "Clear startup package, fast turnaround, and no weird billing surprises. Handled our Delaware incorporation and SAFE notes in under a week.",
      usedVendor: true,
      workType: "Delaware setup and SAFE docs",
      userId: maya.id,
      vendorId: "demo-vendor-legal",
      cohortId: cohort.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Helpful monthly close process. Best if you already have your bookkeeping basics organized.",
      usedVendor: true,
      workType: "Monthly bookkeeping",
      userId: jordan.id,
      vendorId: "demo-vendor-accounting",
      cohortId: cohort.id,
    },
  });

  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment: "Strong counsel on customer contract templates and data-processing language. Clear scopes and fast redlines.",
        usedVendor: true,
        workType: "Customer contract templates",
        userId: lina.id,
        vendorId: "harbor-vendor-legal",
        cohortId: peerCohort.id,
      },
      {
        rating: 4,
        comment: "Practical advice on vendor terms and privacy addenda. Turnaround was predictable and founder-friendly.",
        usedVendor: true,
        workType: "Vendor terms review",
        userId: omar.id,
        vendorId: "harbor-vendor-legal",
        cohortId: peerCohort.id,
      },
      {
        rating: 5,
        comment: "Handled contractor onboarding and multi-state payroll setup without hand-holding. Support replies were crisp.",
        usedVendor: true,
        workType: "Contractor payroll setup",
        userId: lina.id,
        vendorId: "harbor-vendor-payroll",
        cohortId: peerCohort.id,
      },
      {
        rating: 4,
        comment: "Good fit for early teams that need payroll basics and compliance reminders in one place.",
        usedVendor: true,
        workType: "Payroll compliance",
        userId: omar.id,
        vendorId: "harbor-vendor-payroll",
        cohortId: peerCohort.id,
      },
    ],
  });

  // Demo helpful vote
  await prisma.helpfulVote.upsert({
    where: { reviewId_userId: { reviewId: review1.id, userId: jordan.id } },
    update: {},
    create: {
      value: true,
      reviewId: review1.id,
      userId: jordan.id,
    },
  });

  // Demo badges
  await prisma.badge.upsert({
    where: { id: "demo-badge-maya" },
    update: {},
    create: {
      id: "demo-badge-maya",
      type: "reviewer",
      description: "First review submitted",
      userId: maya.id,
    },
  });

  await prisma.badge.upsert({
    where: { id: "demo-badge-jordan" },
    update: {},
    create: {
      id: "demo-badge-jordan",
      type: "community_contributor",
      description: "Active participant in cohort reviews",
      userId: jordan.id,
    },
  });

  // Demo sprint (active for the next 7 days)
  await prisma.sprint.upsert({
    where: { id: "demo-sprint-1" },
    update: {},
    create: {
      id: "demo-sprint-1",
      name: "Q2 Directory Sprint",
      description: "Help us fill gaps in the directory. Focus on SaaS tools you use daily.",
      goalReviewCount: 3,
      startsAt: new Date(Date.now() - 2 * 86400000),
      endsAt: new Date(Date.now() + 7 * 86400000),
      cohortId: cohort.id,
    },
  });

  // Demo exchange request
  await prisma.guestPostExchange.upsert({
    where: { id: "demo-exchange-1" },
    update: {},
    create: {
      id: "demo-exchange-1",
      topic: "How we automated our monthly close",
      message: "Jordan, I'd love to write a post for your blog about how Flow Desk automated its monthly close process. I think it would resonate with your audience.",
      status: "pending",
      requesterId: maya.id,
      recipientId: jordan.id,
      cohortId: cohort.id,
    },
  });

  // Demo backlinks
  await prisma.backlinkLog.deleteMany({
    where: { userId: { in: [maya.id, jordan.id] } },
  });

  await prisma.backlinkLog.createMany({
    data: [
      { referringDomain: "producthunt.com", status: "verified", lastCheckedAt: new Date(), userId: maya.id },
      { referringDomain: "saastr.com", status: "verified", lastCheckedAt: new Date(), userId: maya.id },
      { referringDomain: "indiehackers.com", status: "pending", userId: jordan.id },
    ],
  });

  // Demo vendor request
  await prisma.vendorRequest.deleteMany({
    where: { cohortId: cohort.id },
  });

  await prisma.vendorRequest.create({
    data: {
      category: "Payroll",
      description: "Looking for a payroll provider that can handle contractors and one W-2 employee.",
      status: "open",
      userId: maya.id,
      cohortId: cohort.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

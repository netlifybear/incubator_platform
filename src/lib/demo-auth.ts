import { prisma } from "@/lib/prisma";

const demoPasswords = new Map<string, string>([
  ["maya@example.com", "password"],
  ["jordan@example.com", "password"],
  ["admin@example.com", "password"],
]);

export async function authorizeDemoFounder(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (password !== "password") {
    return null;
  }

  const isSeededDemoUser = demoPasswords.has(normalizedEmail);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  if (!isSeededDemoUser && !user) {
    return null;
  }

  return user;
}

import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { authorizeDemoFounder } from "./demo-auth.ts";
import { prisma } from "./prisma.ts";
import { sendMagicLinkEmail } from "./email.ts";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Demo founder",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        return authorizeDemoFounder(credentials.email, credentials.password);
      },
    }),
    EmailProvider({
      server: "", // We use a custom sendVerificationRequest, so this is unused
      from: process.env.EMAIL_FROM ?? "noreply@incubator-trust.com",
      maxAge: 24 * 60 * 60, // 24 hours
      sendVerificationRequest({ identifier: email, url }) {
        return sendMagicLinkEmail({ to: email, url });
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};

export async function getCurrentFounder() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { cohort: true },
  });
}

export async function getCurrentAdmin() {
  const founder = await getCurrentFounder();

  if (founder?.role !== "admin") {
    return null;
  }

  return founder;
}

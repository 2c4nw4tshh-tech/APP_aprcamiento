import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              points: 100,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          points: user.points,
          stars: user.stars,
          karmaScore: user.karmaScore,
          language: user.language,
          theme: user.theme,
          accentColor: user.accentColor,
          customMarker: user.customMarker,
          onboarded: user.onboarded,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        Object.assign(token, user);
      }

      if (trigger === "update" && token.email) {
        const fresh = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            name: true,
            points: true,
            stars: true,
            karmaScore: true,
            language: true,
            theme: true,
            accentColor: true,
            customMarker: true,
            onboarded: true,
            role: true,
          },
        });
        if (fresh) Object.assign(token, fresh);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user as any, {
          id: token.id,
          points: token.points,
          stars: token.stars,
          karmaScore: token.karmaScore,
          language: token.language,
          theme: token.theme,
          accentColor: token.accentColor,
          customMarker: token.customMarker,
          onboarded: token.onboarded,
          role: token.role,
        });
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

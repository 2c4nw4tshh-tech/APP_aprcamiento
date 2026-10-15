import NextAuth, { AuthOptions } from "next-auth";
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
        if (!credentials?.email) return null;

        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              points: 100,
            },
          });
        }

        return {
          id:          user.id,
          email:       user.email,
          name:        user.name,
          image:       user.image,
          points:      user.points,
          karmaScore:  user.karmaScore,
          language:    user.language,
          theme:       user.theme,
          accentColor: user.accentColor,
          onboarded:   user.onboarded,
          role:        user.role,
        };
      },
    }),
  ],

  callbacks: {
    // jwt se llama en cada petición — aquí refrescamos desde DB
    async jwt({ token, user, trigger }) {
      // Primera vez que se crea el token (login)
      if (user) {
        Object.assign(token, user);
      }

      // Cuando llamamos a update() desde el cliente, refrescamos desde DB
      if (trigger === "update" && token.email) {
        const fresh = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id:          true,
            name:        true,
            points:      true,
            karmaScore:  true,
            language:    true,
            theme:       true,
            accentColor: true,
            onboarded:   true,
            role:        true,
          },
        });
        if (fresh) Object.assign(token, fresh);
      }

      return token;
    },

    async session({ session, token }) {
      // Pasar todos los campos del token a la sesión
      Object.assign(session.user, {
        id:          token.id,
        points:      token.points,
        karmaScore:  token.karmaScore,
        language:    token.language,
        theme:       token.theme,
        accentColor: token.accentColor,
        onboarded:   token.onboarded,
        role:        token.role,
      });
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
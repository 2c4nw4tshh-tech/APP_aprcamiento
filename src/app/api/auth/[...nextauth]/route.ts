import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Modo Prueba / Invitado",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@spotsync.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Busca si el usuario ya existe en Supabase
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Si no existe, lo crea automáticamente en la base de datos
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              points: 100,
            },
          });
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Redirige a tu página de login personalizada
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
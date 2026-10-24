
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return null;
        }

        const staff = await prisma.staffUser.findUnique({
          where: {
            email: email.trim().toLowerCase(),
          },
        });

        if (!staff) {
          return null;
        }

        const validPassword = await bcrypt.compare(
          password,
          staff.passwordHash
        );

        if (!validPassword) {
          return null;
        }

        return {
          id: staff.id,
          email: staff.email,
          name: staff.name,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },
});

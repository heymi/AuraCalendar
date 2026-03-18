import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, account, profile }) {
      // On first sign-in, store the GitHub user ID
      if (account && profile) {
        token.userId = String(profile.id);
        token.avatar = (profile as { avatar_url?: string }).avatar_url ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.image = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

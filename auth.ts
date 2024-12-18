import NextAuth from "next-auth"
import GitHub from "@auth/core/providers/github";
import {AUTHOR_BY_GITHUB_ID_QUERY} from "@/lib/queries";
import {client} from "@/sanity/lib/client";
import {writeClient} from "@/sanity/lib/write-client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async signIn({ user: { name, email, image }, profile: { id, login, bio }}) {
      console.log("ID Profile " + id)
      const existingUser = await client.withConfig({ useCdn: false }).fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id })

      if (!existingUser) {
        await writeClient.create({
          _type: 'author',
          id: id,
          name: name,
          username: login,
          email: email,
          image: image,
          bio: bio || ""
        })
      }

      if (existingUser) {
        return true;
      }
    },
    async jwt({ token, account, profile}) {
      if (account && profile) {
        const user = await client.withConfig({ useCdn: false }).fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: profile?.id });
        token.id = user?._id
      }

      return token
    },
    async session({ session, token}) {
      if (token) {
        Object.assign(session, { id: token.id });
        return session;
      }
    }
  }
})
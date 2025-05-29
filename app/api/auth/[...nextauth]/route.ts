import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth-options";

const handler = NextAuth(authOptions);

export { authOptions, handler as GET, handler as POST };
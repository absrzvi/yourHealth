import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// Export a Next.js API route handler for NextAuth.js
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";
import { ensureAppPath, resolveAuthUrl, resolveRedirectUrl } from "@/lib/auth-path";
import { verifyPassword } from "@/lib/password";
import {
  bootstrapPrimaryOwner,
  isPrimaryOwnerEmail,
  repairPrimaryOwnerAccountCollision,
  syncGoogleIdentitySnapshot,
  touchUserLastActive,
} from "@/modules/auth/bootstrap";
import { credentialsSignInSchema } from "@/modules/auth/schemas";

const authUrl = resolveAuthUrl(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.APP_URL);

if (authUrl) {
  process.env.AUTH_URL = authUrl;
  process.env.NEXTAUTH_URL = authUrl;
  process.env.NEXTAUTH_URL_INTERNAL ??= authUrl;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

export function createAuthOptions(input: {
  currentUserId?: string | null;
} = {}): NextAuthOptions {
  return {
    adapter: PrismaAdapter(db),
    secret: process.env.AUTH_SECRET ?? "dev-auth-secret",
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: ensureAppPath("/auth/signin"),
      error: ensureAppPath("/auth/error"),
    },
    providers: [
      CredentialsProvider({
        name: "Email",
        credentials: {
          email: {
            label: "Email",
            type: "email",
          },
          password: {
            label: "Password",
            type: "password",
          },
        },
        async authorize(credentials) {
          const parsed = credentialsSignInSchema.safeParse(credentials);

          if (!parsed.success) {
            return null;
          }

          const email = parsed.data.email.trim().toLowerCase();
          const user = await db.user.findUnique({
            where: {
              email,
            },
            include: {
              memberships: {
                where: {
                  isArchived: false,
                  status: "ACTIVE",
                  workspace: {
                    isArchived: false,
                  },
                },
                take: 1,
              },
            },
          });

          if (!user?.passwordHash) {
            return null;
          }

          const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);

          if (!passwordMatches || user.memberships.length === 0) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? "google-client-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "google-client-secret",
        allowDangerousEmailAccountLinking: false,
        // Avoid runtime OIDC discovery on every sign-in attempt and tolerate slower outbound links.
        wellKnown: "",
        issuer: "https://accounts.google.com",
        authorization: {
          url: "https://accounts.google.com/o/oauth2/v2/auth",
          params: {
            scope: "openid email profile",
          },
        },
        token: "https://oauth2.googleapis.com/token",
        userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
        jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
        httpOptions: {
          timeout: 10000,
        },
      }),
    ],
    callbacks: {
      async redirect({ url, baseUrl }) {
        return resolveRedirectUrl(url, baseUrl);
      },
      async signIn({ user, account, profile }) {
        const email = normalizeEmail(user.email);

        if (!email || !account) {
          return false;
        }

        if (account.provider === "credentials") {
          return true;
        }

        const currentUser = input.currentUserId
          ? await db.user.findUnique({
              where: {
                id: input.currentUserId,
              },
              select: {
                email: true,
                id: true,
              },
            })
          : null;

        if (account.provider === "google" && currentUser) {
          if (email !== normalizeEmail(currentUser.email)) {
            return ensureAppPath("/profile?error=google-email-mismatch");
          }

          if (account.providerAccountId) {
            const existingGoogleAccount = await db.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              select: {
                userId: true,
              },
            });

            if (existingGoogleAccount && existingGoogleAccount.userId !== currentUser.id) {
              return ensureAppPath("/profile?error=google-account-conflict");
            }
          }

          return true;
        }

        if (isPrimaryOwnerEmail(email)) {
          await repairPrimaryOwnerAccountCollision({
            account,
            profile: profile ?? undefined,
            email,
          });

          return true;
        }

        const now = new Date();
        const [membership, invitation] = await Promise.all([
          db.membership.findFirst({
            where: {
              isArchived: false,
              user: {
                email,
              },
              workspace: {
                isArchived: false,
              },
            },
          }),
          db.invitation.findFirst({
            where: {
              email,
              status: "PENDING",
              expiresAt: {
                gt: now,
              },
            },
          }),
        ]);

        return Boolean(membership || invitation);
      },
      async jwt({ token, user, account, profile }) {
        if (user?.id) {
          token.id = user.id;
          await touchUserLastActive(user.id);

          if (account?.provider === "google") {
            await syncGoogleIdentitySnapshot({
              userId: user.id,
              profile,
            });
          }

          await bootstrapPrimaryOwner({
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          });
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user && typeof token.id === "string") {
          session.user.id = token.id;
        }

        return session;
      },
    },
  };
}

export const authOptions: NextAuthOptions = createAuthOptions();

export function auth() {
  return getServerSession(createAuthOptions());
}

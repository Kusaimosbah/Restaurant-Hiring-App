import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Authorizing with credentials:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              restaurant: true,
              workerProfile: true
            }
          })

          console.log('User found:', user ? `${user.name} (${user.email})` : 'No user found')

          if (!user) {
            return null
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('Password match:', passwordMatch)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            restaurant: user.restaurant,
            workerProfile: user.workerProfile
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (match refresh token)
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.restaurant = user.restaurant
        token.workerProfile = user.workerProfile
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.restaurant = token.restaurant as any
        session.user.workerProfile = token.workerProfile as any
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development' // Only enable debug in development
}
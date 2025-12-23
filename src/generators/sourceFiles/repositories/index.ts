import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateRepositories(repositoriesDir: string, config: ProjectConfig): Promise<void> {
  if (config.includeAuth) {
    const userRepositoryContent = `import { prisma } from '../config/database.js';

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async create(data: { email: string; password: string; name?: string; emailVerificationToken?: string; emailVerificationExpires?: Date }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateEmailVerification(id: string, verified: boolean) {
    return prisma.user.update({
      where: { id },
      data: {
        emailVerified: verified,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  },

  async findByVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });
  },

  async updateVerificationToken(id: string, token: string, expires: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });
  },

  async updatePasswordResetToken(id: string, token: string, expires: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });
  },

  async findByPasswordResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });
  },

  async updatePassword(id: string, password: string) {
    return prisma.user.update({
      where: { id },
      data: {
        password,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  },
};
`;

    await fs.writeFile(
      path.join(repositoriesDir, 'user.repository.ts'),
      userRepositoryContent
    );
  }
}

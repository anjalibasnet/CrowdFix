const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test Authority',
        email: 'authority@test.com',
        passwordHash: hash,
        role: 'AUTHORITY',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('✓ User created:', user.id, user.email);

    const authority = await prisma.authority.create({
      data: {
        userId: user.id,
        jurisdiction: 'Naju',
        officerTitle: 'Test Officer',
      },
    });
    console.log('✓ Authority created');
    console.log('\nLogin credentials:');
    console.log('Email: authority@test.com');
    console.log('Password: password123');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
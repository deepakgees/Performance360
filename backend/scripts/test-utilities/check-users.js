/**
 * User Database Check Utility
 * 
 * Lists all users in the database with their basic information
 * 
 * Usage:
 *   node scripts/test-utilities/check-users.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
      orderBy: { email: 'asc' },
    });

    console.log(`📊 Found ${users.length} user(s):\n`);
    users.forEach(user => {
      console.log(
        `   - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - Active: ${user.isActive}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

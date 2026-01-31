/**
 * Database Seeding Script
 *
 * This script populates the database with sample data for development and testing.
 * Run this script after database migrations or when you need to reset to a known state.
 *
 * Usage:
 * npm run db:seed
 *
 * Or directly:
 * node scripts/seed-database.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_USER = {
  email: 'admin@company.com',
  firstName: 'admin',
  lastName: 'user',
  password: 'admin123',
  role: 'ADMIN',
  position: 'BU Lead',
};

const MANAGER_USER = {
  email: 'manager@company.com',
  firstName: 'manager',
  lastName: 'user',
  password: 'manager123',
  role: 'MANAGER',
  position: 'Manager',
};

const EMPLOYEE_USER = {
  email: 'employee@company.com',
  firstName: 'employee',
  lastName: 'user',
  password: 'employee123',
  role: 'EMPLOYEE',
  position: 'Senior Developer',
};

// Sample data constants
const SAMPLE_USERS = [ADMIN_USER, MANAGER_USER, EMPLOYEE_USER];

const SAMPLE_COLLEAGUE_FEEDBACK = [
  {
    rating: 5,
    year: '2024',
    quarter: 'Q1',
    isAnonymous: false,
    isPublic: true,
    status: 'COMPLETED',
    feedbackProvider: 'admin user',
    appreciation:
      'Excellent problem-solving skills and always willing to help team members.',
    improvement: 'Could improve documentation practices.',
    wouldWorkAgain: true,
  },
  {
    rating: 4,
    year: '2024',
    quarter: 'Q1',
    isAnonymous: true,
    isPublic: false,
    status: 'COMPLETED',
    feedbackProvider: 'Anonymous',
    appreciation: 'Great communication skills and attention to detail.',
    improvement: 'Sometimes takes on too many tasks at once.',
    wouldWorkAgain: true,
  },
  {
    rating: 5,
    year: '2024',
    quarter: 'Q1',
    isAnonymous: false,
    isPublic: true,
    status: 'COMPLETED',
    feedbackProvider: 'manager user',
    appreciation: 'Outstanding collaboration and innovative thinking.',
    improvement: 'Could be more vocal in team meetings.',
    wouldWorkAgain: true,
  },
];

const SAMPLE_MANAGER_FEEDBACK = [
  {
    year: '2024',
    quarter: 'Q1',
    isAnonymous: false,
    isPublic: false,
    status: 'COMPLETED',
    feedbackProvider: 'admin user',
    managerSatisfaction: 'Very satisfied with performance and growth.',
    leadershipStyle: {
      style: 'Democratic',
      feedback:
        'Manager encourages team input and collaboration in decision-making.',
    },
    careerGrowth: {
      question: 'What are your career goals?',
      answer: 'To become a technical lead and mentor junior developers.',
    },
    coachingCaring: {
      question: 'How do you support your team members?',
      answer:
        'Regular 1:1s, code reviews, and providing learning opportunities.',
    },
    managerOverallRating: 4,
  },
];

const SAMPLE_SELF_ASSESSMENTS = [
  {
    year: 2024,
    quarter: 'Q1',
    rating: 4,
    achievements: 'Completed major feature implementation, mentored 2 junior developers, and improved code review process',
    improvements: 'Need to improve documentation skills and time management',
    satisfactionLevel: 'VERY_SATISFIED',
    aspirations: 'Take on more leadership responsibilities and lead a major project',
    suggestionsForTeam: 'Implement better code review process and improve team communication',
  },
  {
    year: 2024,
    quarter: 'Q2',
    rating: 5,
    achievements: 'Led successful project delivery and improved team productivity by 20%',
    improvements: 'Could enhance presentation skills',
    satisfactionLevel: 'VERY_SATISFIED',
    aspirations: 'Become a tech lead and mentor more junior developers',
    suggestionsForTeam: 'Add more training sessions and improve knowledge sharing',
  },
];

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Clear all existing data from the database
 */
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');

  // Delete in order to respect foreign key constraints
  await prisma.selfAssessmentV2.deleteMany();
  await prisma.managerFeedback.deleteMany();
  await prisma.colleagueFeedback.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared successfully');
}

/**
 * Create sample users
 */
async function createUsers() {
  console.log('👥 Creating sample users...');

  const createdUsers = [];

  for (const userData of SAMPLE_USERS) {
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
        role: userData.role,
        position: userData.position,
      },
    });

    createdUsers.push(user);
    console.log(
      `✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`
    );
  }

  return createdUsers;
}

/**
 * Set up manager-employee relationships
 */
async function setupManagerRelationships(users) {
  console.log('👨‍💼 Setting up manager-employee relationships...');

  const managerUser = users.find(u => u.email === 'manager@company.com');
  const adminUser = users.find(u => u.email === 'admin@company.com');

  // Engineering team under Manager
  const engineeringEmployees = users.filter(u => u.role === 'EMPLOYEE');

  for (const employee of engineeringEmployees) {
    await prisma.user.update({
      where: { id: employee.id },
      data: { managerId: managerUser.id },
    });
  }

  // Product team under admin
  const productEmployees = users.filter(u => u.role === 'EMPLOYEE');

  for (const employee of productEmployees) {
    await prisma.user.update({
      where: { id: employee.id },
      data: { managerId: adminUser.id },
    });
  }

  console.log('✅ Manager relationships set up successfully');
}

/**
 * Create sample colleague feedback
 */
async function createColleagueFeedback(users) {
  console.log('💬 Creating sample colleague feedback...');

  const employee = users.find(u => u.email === 'employee@company.com');
  const manager = users.find(u => u.email === 'manager@company.com');
  const admin = users.find(u => u.email === 'admin@company.com');

  // "employee" gives feedback to "manager"
  await prisma.colleagueFeedback.create({
    data: {
      ...SAMPLE_COLLEAGUE_FEEDBACK[0],
      senderId: employee.id,
      receiverId: manager.id,
    },
  });

  // Anonymous feedback to manager
  await prisma.colleagueFeedback.create({
    data: {
      ...SAMPLE_COLLEAGUE_FEEDBACK[1],
      senderId: employee.id,
      receiverId: manager.id,
    },
  });

  // Manager gives feedback to Admin
  await prisma.colleagueFeedback.create({
    data: {
      ...SAMPLE_COLLEAGUE_FEEDBACK[2],
      senderId: manager.id,
      receiverId: admin.id,
    },
  });

  console.log('✅ Sample colleague feedback created successfully');
}

/**
 * Create sample manager feedback
 */
async function createManagerFeedback(users) {
  console.log('👨‍💼 Creating sample manager feedback...');

  const manager = users.find(u => u.email === 'manager@company.com');
  const admin = users.find(u => u.email === 'admin@company.com');

  await prisma.managerFeedback.create({
    data: {
      ...SAMPLE_MANAGER_FEEDBACK[0],
      senderId: manager.id,
      receiverId: admin.id,
    },
  });

  console.log('✅ Sample manager feedback created successfully');
}

/**
 * Create sample self assessments
 */
async function createSelfAssessments(users) {
  console.log('📝 Creating sample self assessments...');

  const employee = users.find(u => u.email === 'employee@company.com');

  // Create multiple sample assessments
  for (const assessment of SAMPLE_SELF_ASSESSMENTS) {
    await prisma.selfAssessmentV2.create({
      data: {
        ...assessment,
        userId: employee.id,
      },
    });
  }

  console.log(`✅ Created ${SAMPLE_SELF_ASSESSMENTS.length} sample self assessments`);
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await clearDatabase();

    // Create users
    const users = await createUsers();

    // Set up manager relationships
    await setupManagerRelationships(users);

    // Create sample data
    await createColleagueFeedback(users);
    await createManagerFeedback(users);
    await createSelfAssessments(users);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(
      `   💬 Colleague Feedback: ${SAMPLE_COLLEAGUE_FEEDBACK.length}`
    );
    console.log(`   👨‍💼 Manager Feedback: ${SAMPLE_MANAGER_FEEDBACK.length}`);
    console.log(`   📝 Self Assessments (V2): ${SAMPLE_SELF_ASSESSMENTS.length}`);

    console.log('\n🔑 Sample Login Credentials:');
    console.log('   Admin: admin@company.com / admin123');
    console.log('   Manager: manager@company.com / manager123');
    console.log('   Employee: employee@company.com / employee123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run the seeding script
 */
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase, ADMIN_USER, MANAGER_USER, EMPLOYEE_USER };

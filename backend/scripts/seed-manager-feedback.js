const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedManagerFeedback() {
  try {
    console.log('🌱 Seeding manager feedback data...');

    // Get existing users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create manager feedback');
      return;
    }

    // Find a manager user
    const manager = users.find(user => user.role === 'MANAGER') || users[0];
    const employee = users.find(user => user.id !== manager.id) || users[1];

    console.log(
      `📝 Creating manager feedback from ${employee.firstName} to ${manager.firstName}...`
    );

    // Create sample manager feedback
    const managerFeedback = await prisma.managerFeedback.create({
      data: {
        senderId: employee.id,
        receiverId: manager.id,
        year: '2024',
        quarter: 'Q1',
        feedbackProvider: `${employee.firstName} ${employee.lastName}`,
        managerSatisfaction:
          "I am satisfied with my manager's leadership style and support.",
        leadershipStyle: {
          style: 'Democratic',
          feedback:
            'Manager encourages team input and collaboration in decision-making.',
        },
        careerGrowth: {
          opportunities: [
            'Training programs',
            'Mentorship',
            'Project leadership',
          ],
          feedback:
            'Manager actively supports career development through various opportunities.',
        },
        coachingCaring: {
          coaching: 'Regular one-on-one meetings',
          caring: 'Shows genuine concern for team well-being',
          feedback:
            'Manager provides excellent coaching and shows genuine care for the team.',
        },
        managerOverallRating: 4,
        appreciation:
          'Overall, my manager is effective and supportive. I appreciate their leadership approach.',
        improvementAreas:
          'Could improve in providing more frequent feedback and clearer communication on long-term goals.',
      },
    });

    console.log('✅ Manager feedback created successfully!');
    console.log('📊 Feedback ID:', managerFeedback.id);
    console.log('👤 From:', `${employee.firstName} ${employee.lastName}`);
    console.log('👤 To:', `${manager.firstName} ${manager.lastName}`);
    console.log(
      '📅 Period:',
      `${managerFeedback.year} ${managerFeedback.quarter}`
    );
    console.log('⭐ Rating:', managerFeedback.managerOverallRating);

    // Create another sample with different data
    const managerFeedback2 = await prisma.managerFeedback.create({
      data: {
        senderId: employee.id,
        receiverId: manager.id,
        year: '2024',
        quarter: 'Q2',
        feedbackProvider: `${employee.firstName} ${employee.lastName}`,
        managerSatisfaction: 'Generally satisfied with management approach.',
        managerOverallRating: 3,
        appreciation:
          'Good manager overall, provides clear direction and support.',
        improvementAreas:
          'Could improve in some areas like providing more detailed feedback.',
      },
    });

    console.log('✅ Second manager feedback created successfully!');
    console.log('📊 Feedback ID:', managerFeedback2.id);
    console.log('👤 Anonymous feedback');
    console.log(
      '📅 Period:',
      `${managerFeedback2.year} ${managerFeedback2.quarter}`
    );
    console.log('⭐ Rating:', managerFeedback2.managerOverallRating);
  } catch (error) {
    console.error('❌ Error seeding manager feedback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedManagerFeedback();

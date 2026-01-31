const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAchievements() {
  try {
    console.log('🌱 Seeding achievements and observations...');

    // Get all users to create sample achievements
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });

    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    // Sample achievements data
    const sampleAchievements = [
      {
        date: new Date('2024-01-15'),
        achievement: 'Successfully completed the Q1 project ahead of schedule',
        observation:
          'Demonstrated excellent project management skills and team collaboration. The team was highly motivated and delivered quality work.',
      },
      {
        date: new Date('2024-02-20'),
        achievement:
          'Implemented new automation process that reduced manual work by 40%',
        observation:
          'Showed strong problem-solving abilities and initiative. The solution was well-documented and adopted by the entire team.',
      },
      {
        date: new Date('2024-03-10'),
        achievement:
          'Mentored 3 junior developers and helped them improve their skills',
        observation:
          'Excellent leadership qualities and patience in teaching. The mentees showed significant improvement in their coding practices.',
      },
      {
        date: new Date('2024-04-05'),
        achievement: 'Resolved critical production issue within 2 hours',
        observation:
          'Demonstrated strong debugging skills and ability to work under pressure. The quick resolution prevented significant downtime.',
      },
      {
        date: new Date('2024-05-12'),
        achievement:
          'Led successful client presentation that resulted in new project approval',
        observation:
          'Excellent communication skills and technical knowledge. The client was impressed with the thorough understanding of requirements.',
      },
    ];

    // Create achievements for each user
    for (const user of users) {
      // Skip if user has no manager (likely a top-level user)
      const userWithManager = await prisma.user.findUnique({
        where: { id: user.id },
        include: { manager: true },
      });

      if (!userWithManager.manager) {
        console.log(
          `Skipping ${user.firstName} ${user.lastName} - no manager found`
        );
        continue;
      }

      // Create 2-3 achievements per user
      const userAchievements = sampleAchievements.slice(
        0,
        Math.floor(Math.random() * 3) + 2
      );

      for (const achievement of userAchievements) {
        await prisma.achievementsAndObservations.create({
          data: {
            userId: user.id,
            createdBy: userWithManager.manager.id,
            date: achievement.date,
            achievement: achievement.achievement,
            observation: achievement.observation,
          },
        });
      }

      console.log(
        `✅ Created ${userAchievements.length} achievements for ${user.firstName} ${user.lastName}`
      );
    }

    console.log('🎉 Achievements and observations seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAchievements();

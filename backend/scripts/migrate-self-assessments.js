/**
 * Migration Script: Self Assessments V1 to V2
 *
 * This script migrates data from the old self_assessments table
 * to the new self_assessments_v2 table with normalized structure.
 *
 * Usage:
 * node scripts/migrate-self-assessments.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Parse period string (e.g., "Q1 2024") to extract year and quarter
 */
function parsePeriod(period) {
  if (!period) return { year: null, quarter: null };

  // Match patterns like "Q1 2024", "Q2 2024", etc.
  const match = period.match(/(Q[1-4])\s+(\d{4})/i);
  if (match) {
    return {
      quarter: match[1].toUpperCase(), // Q1, Q2, Q3, Q4
      year: parseInt(match[2]),
    };
  }

  // Match patterns like "Annual 2024"
  const annualMatch = period.match(/annual\s+(\d{4})/i);
  if (annualMatch) {
    return {
      quarter: 'ANNUAL',
      year: parseInt(annualMatch[1]),
    };
  }

  // Try to extract just year
  const yearMatch = period.match(/(\d{4})/);
  if (yearMatch) {
    return {
      quarter: null,
      year: parseInt(yearMatch[1]),
    };
  }

  return { year: null, quarter: null };
}

/**
 * Extract rating from content JSON
 */
function extractRating(content) {
  if (!content || typeof content !== 'object') return null;

  // Check if there's a direct rating field
  if (content.rating !== undefined) {
    return parseInt(content.rating);
  }

  // Check answers object for rating question
  if (content.answers) {
    // Look for rating in answers (question ID '1' is typically rating)
    const ratingValue = content.answers['1'] || 
                       Object.values(content.answers).find(v => 
                         typeof v === 'number' && v >= 1 && v <= 5
                       );
    if (ratingValue) {
      return parseInt(ratingValue);
    }
  }

  // Check skills object for overall rating
  if (content.skills) {
    const skills = content.skills;
    const skillValues = Object.values(skills).filter(v => typeof v === 'number');
    if (skillValues.length > 0) {
      // Average of skill ratings
      const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length;
      return Math.round(avg);
    }
  }

  return null;
}

/**
 * Extract achievements from content JSON
 */
function extractAchievements(content) {
  if (!content || typeof content !== 'object') return null;

  // Check direct achievements field
  if (content.achievements) {
    if (Array.isArray(content.achievements)) {
      return content.achievements.join(', ');
    }
    return String(content.achievements);
  }

  // Check answers object
  if (content.answers) {
    // Question ID '2' is typically achievements
    const achievements = content.answers['2'];
    if (achievements) {
      return String(achievements);
    }

    // Look for achievements in any answer
    const achievementsKey = Object.keys(content.answers).find(key => 
      content.answers[key] && 
      (String(content.answers[key]).toLowerCase().includes('achievement') ||
       String(content.answers[key]).toLowerCase().includes('completed'))
    );
    if (achievementsKey) {
      return String(content.answers[achievementsKey]);
    }
  }

  // Check strengths field
  if (content.strengths && Array.isArray(content.strengths)) {
    return content.strengths.join(', ');
  }

  return null;
}

/**
 * Extract improvements from content JSON
 */
function extractImprovements(content) {
  if (!content || typeof content !== 'object') return null;

  // Check direct improvements field
  if (content.improvements) {
    if (Array.isArray(content.improvements)) {
      return content.improvements.join(', ');
    }
    return String(content.improvements);
  }

  // Check areas_for_improvement
  if (content.areas_for_improvement) {
    if (Array.isArray(content.areas_for_improvement)) {
      return content.areas_for_improvement.join(', ');
    }
    return String(content.areas_for_improvement);
  }

  // Check challenges
  if (content.challenges && Array.isArray(content.challenges)) {
    return content.challenges.join(', ');
  }

  // Check answers object
  if (content.answers) {
    // Question ID '3' is typically improvements
    const improvements = content.answers['3'];
    if (improvements) {
      return String(improvements);
    }
  }

  return null;
}

/**
 * Map satisfaction string to enum value
 */
function mapSatisfactionLevel(satisfaction) {
  if (!satisfaction) return null;

  const satisfactionStr = String(satisfaction).toUpperCase();
  
  const mapping = {
    'VERY SATISFIED': 'VERY_SATISFIED',
    'SOMEWHAT SATISFIED': 'SOMEWHAT_SATISFIED',
    'NEITHER SATISFIED NOR DISSATISFIED': 'NEITHER',
    'NEITHER': 'NEITHER',
    'SOMEWHAT DISSATISFIED': 'SOMEWHAT_DISSATISFIED',
    'VERY DISSATISFIED': 'VERY_DISSATISFIED',
  };

  // Direct enum match
  if (['VERY_SATISFIED', 'SOMEWHAT_SATISFIED', 'NEITHER', 'SOMEWHAT_DISSATISFIED', 'VERY_DISSATISFIED'].includes(satisfactionStr)) {
    return satisfactionStr;
  }

  // Try to find in mapping
  for (const [key, value] of Object.entries(mapping)) {
    if (satisfactionStr.includes(key.replace(/_/g, ' '))) {
      return value;
    }
  }

  return null;
}

/**
 * Extract satisfaction level from content JSON
 */
function extractSatisfactionLevel(content) {
  if (!content || typeof content !== 'object') return null;

  // Check direct satisfaction field
  if (content.satisfaction) {
    return mapSatisfactionLevel(content.satisfaction);
  }

  if (content.satisfactionLevel) {
    return mapSatisfactionLevel(content.satisfactionLevel);
  }

  // Check answers object
  if (content.answers) {
    // Question ID '4' is typically satisfaction
    const satisfaction = content.answers['4'];
    if (satisfaction) {
      return mapSatisfactionLevel(satisfaction);
    }
  }

  return null;
}

/**
 * Extract aspirations from content JSON
 */
function extractAspirations(content) {
  if (!content || typeof content !== 'object') return null;

  // Check direct aspirations field
  if (content.aspirations) {
    return String(content.aspirations);
  }

  // Check goals
  if (content.goals && Array.isArray(content.goals)) {
    return content.goals.join(', ');
  }

  return null;
}

/**
 * Extract team suggestions from content JSON
 */
function extractSuggestionsForTeam(content) {
  if (!content || typeof content !== 'object') return null;

  // Check direct suggestionsForTeam field
  if (content.suggestionsForTeam) {
    return String(content.suggestionsForTeam);
  }

  // Check team_changes
  if (content.team_changes) {
    return String(content.team_changes);
  }

  // Check answers object
  if (content.answers) {
    // Question ID '5' is typically team changes
    const suggestions = content.answers['5'];
    if (suggestions) {
      return String(suggestions);
    }
  }

  return null;
}

/**
 * Migrate a single assessment from V1 to V2
 */
async function migrateAssessment(oldAssessment) {
  try {
    // Parse period
    const { year, quarter } = parsePeriod(oldAssessment.period);
    
    if (!year) {
      console.warn(`⚠️  Skipping assessment ${oldAssessment.id}: Could not parse year from period "${oldAssessment.period}"`);
      return { skipped: true, reason: 'Could not parse year' };
    }

    // Extract data from content JSON
    const content = oldAssessment.content || {};
    const rating = extractRating(content);
    const achievements = extractAchievements(content);
    const improvements = extractImprovements(content);
    const satisfactionLevel = extractSatisfactionLevel(content);
    const aspirations = extractAspirations(content);
    const suggestionsForTeam = extractSuggestionsForTeam(content);

    // Check if assessment already exists for this user/year/quarter
    const existing = await prisma.selfAssessmentV2.findUnique({
      where: {
        userId_year_quarter: {
          userId: oldAssessment.userId,
          year: year,
          quarter: quarter || null,
        },
      },
    });

    if (existing) {
      console.log(`⏭️  Skipping assessment ${oldAssessment.id}: Already exists for user ${oldAssessment.userId}, ${quarter || 'Annual'} ${year}`);
      return { skipped: true, reason: 'Already exists' };
    }

    // Create new assessment
    const newAssessment = await prisma.selfAssessmentV2.create({
      data: {
        userId: oldAssessment.userId,
        year: year,
        quarter: quarter || null,
        rating: rating,
        achievements: achievements,
        improvements: improvements,
        satisfactionLevel: satisfactionLevel,
        aspirations: aspirations,
        suggestionsForTeam: suggestionsForTeam,
        createdAt: oldAssessment.createdAt,
        updatedAt: oldAssessment.updatedAt,
      },
    });

    console.log(`✅ Migrated assessment ${oldAssessment.id} -> ${newAssessment.id} (${quarter || 'Annual'} ${year})`);
    return { migrated: true, newId: newAssessment.id };
  } catch (error) {
    console.error(`❌ Error migrating assessment ${oldAssessment.id}:`, error.message);
    return { error: true, message: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateSelfAssessments() {
  try {
    console.log('🚀 Starting migration from self_assessments to self_assessments_v2...\n');

    // Fetch all old assessments
    const oldAssessments = await prisma.selfAssessment.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${oldAssessments.length} assessments to migrate\n`);

    if (oldAssessments.length === 0) {
      console.log('✅ No assessments to migrate. Migration complete!');
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Migrate each assessment
    for (const assessment of oldAssessments) {
      const result = await migrateAssessment(assessment);
      
      if (result.migrated) {
        migrated++;
      } else if (result.skipped) {
        skipped++;
      } else if (result.error) {
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total processed: ${oldAssessments.length}\n`);

    console.log('🎉 Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateSelfAssessments()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSelfAssessments };


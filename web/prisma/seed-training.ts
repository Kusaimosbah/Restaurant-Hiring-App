import { PrismaClient, Role, MaterialType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding training modules and materials...');

  // Clean up existing data if needed
  await prisma.trainingProgress.deleteMany({});
  await prisma.trainingMaterial.deleteMany({});
  await prisma.trainingModule.deleteMany({});

  // Create Restaurant Owner Onboarding Modules
  const restaurantBasics = await prisma.trainingModule.create({
    data: {
      title: 'Restaurant Basics',
      description: 'Learn the fundamentals of setting up your restaurant profile and managing your business on our platform.',
      order: 1,
      isRequired: true,
      estimatedTimeMinutes: 30,
      targetRole: Role.RESTAURANT_OWNER,
      materials: {
        create: [
          {
            title: 'Welcome to Restaurant Hiring',
            description: 'An introduction to the platform and its features for restaurant owners.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/welcome-restaurant-owners',
            order: 1,
            estimatedTimeMinutes: 5
          },
          {
            title: 'Setting Up Your Restaurant Profile',
            description: 'Learn how to create and optimize your restaurant profile to attract the best talent.',
            type: MaterialType.DOCUMENT,
            content: 'https://example.com/docs/restaurant-profile-setup',
            order: 2,
            estimatedTimeMinutes: 10
          },
          {
            title: 'Restaurant Profile Quiz',
            description: 'Test your knowledge about setting up your restaurant profile.',
            type: MaterialType.QUIZ,
            content: JSON.stringify({
              questions: [
                {
                  question: 'What information is most important to include in your restaurant profile?',
                  options: [
                    'Only the restaurant name and address',
                    'Restaurant name, description, cuisine type, and photos',
                    'Only the menu and prices',
                    'Only the restaurant logo'
                  ],
                  correctAnswer: 1
                },
                {
                  question: 'How many photos should you include in your restaurant profile?',
                  options: [
                    'None',
                    '1 photo is sufficient',
                    'At least 3-5 high-quality photos',
                    'Only black and white photos'
                  ],
                  correctAnswer: 2
                }
              ]
            }),
            order: 3,
            estimatedTimeMinutes: 5
          }
        ]
      }
    }
  });

  const jobPostingModule = await prisma.trainingModule.create({
    data: {
      title: 'Creating Effective Job Postings',
      description: 'Learn how to create job postings that attract qualified candidates.',
      order: 2,
      isRequired: true,
      estimatedTimeMinutes: 45,
      targetRole: Role.RESTAURANT_OWNER,
      materials: {
        create: [
          {
            title: 'Job Posting Best Practices',
            description: 'Learn the key elements of an effective job posting.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/job-posting-best-practices',
            order: 1,
            estimatedTimeMinutes: 8
          },
          {
            title: 'Writing Job Descriptions',
            description: 'How to write clear and compelling job descriptions.',
            type: MaterialType.DOCUMENT,
            content: 'https://example.com/docs/writing-job-descriptions',
            order: 2,
            estimatedTimeMinutes: 12
          },
          {
            title: 'Setting Competitive Pay Rates',
            description: 'Guidelines for setting competitive pay rates to attract talent.',
            type: MaterialType.DOCUMENT,
            content: 'https://example.com/docs/competitive-pay-rates',
            order: 3,
            estimatedTimeMinutes: 10
          },
          {
            title: 'Job Posting Interactive Exercise',
            description: 'Practice creating a job posting with this interactive tool.',
            type: MaterialType.INTERACTIVE,
            content: 'https://example.com/interactive/job-posting-exercise',
            order: 4,
            estimatedTimeMinutes: 15
          }
        ]
      }
    }
  });

  // Create Worker Onboarding Modules
  const workerBasics = await prisma.trainingModule.create({
    data: {
      title: 'Getting Started as a Worker',
      description: 'Learn how to set up your profile and find job opportunities.',
      order: 1,
      isRequired: true,
      estimatedTimeMinutes: 25,
      targetRole: Role.WORKER,
      materials: {
        create: [
          {
            title: 'Welcome to Restaurant Hiring',
            description: 'An introduction to the platform for job seekers.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/welcome-workers',
            order: 1,
            estimatedTimeMinutes: 5
          },
          {
            title: 'Creating Your Worker Profile',
            description: 'Learn how to create a standout profile that gets you hired.',
            type: MaterialType.DOCUMENT,
            content: 'https://example.com/docs/worker-profile-guide',
            order: 2,
            estimatedTimeMinutes: 10
          },
          {
            title: 'Uploading Documents and Certifications',
            description: 'How to add your work documents and certifications to your profile.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/document-upload-guide',
            order: 3,
            estimatedTimeMinutes: 5
          },
          {
            title: 'Worker Profile Quiz',
            description: 'Test your knowledge about setting up your worker profile.',
            type: MaterialType.QUIZ,
            content: JSON.stringify({
              questions: [
                {
                  question: 'What should you include in your worker bio?',
                  options: [
                    'Only your name',
                    'Your experience, skills, and what makes you unique',
                    'Your favorite restaurants',
                    'Only your contact information'
                  ],
                  correctAnswer: 1
                },
                {
                  question: 'How important is adding a profile picture?',
                  options: [
                    'Not important',
                    'Somewhat important',
                    'Very important - profiles with photos get 7x more views',
                    'Only important for certain positions'
                  ],
                  correctAnswer: 2
                }
              ]
            }),
            order: 4,
            estimatedTimeMinutes: 5
          }
        ]
      }
    }
  });

  const jobSearchModule = await prisma.trainingModule.create({
    data: {
      title: 'Finding and Applying for Jobs',
      description: 'Learn how to search for jobs and submit winning applications.',
      order: 2,
      isRequired: true,
      estimatedTimeMinutes: 35,
      targetRole: Role.WORKER,
      materials: {
        create: [
          {
            title: 'Using the Job Search Tools',
            description: 'How to use filters and map view to find the perfect job.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/job-search-tools',
            order: 1,
            estimatedTimeMinutes: 7
          },
          {
            title: 'Writing an Effective Application',
            description: 'Tips for making your application stand out to employers.',
            type: MaterialType.DOCUMENT,
            content: 'https://example.com/docs/effective-applications',
            order: 2,
            estimatedTimeMinutes: 8
          },
          {
            title: 'Quick Apply Feature',
            description: 'How to use the Quick Apply feature to apply for jobs faster.',
            type: MaterialType.VIDEO,
            content: 'https://example.com/videos/quick-apply-guide',
            order: 3,
            estimatedTimeMinutes: 5
          },
          {
            title: 'Job Application Interactive Exercise',
            description: 'Practice applying for a job with this interactive simulation.',
            type: MaterialType.INTERACTIVE,
            content: 'https://example.com/interactive/job-application-exercise',
            order: 4,
            estimatedTimeMinutes: 15
          }
        ]
      }
    }
  });

  // Set up prerequisites
  await prisma.trainingModule.update({
    where: { id: jobPostingModule.id },
    data: {
      prerequisites: {
        connect: { id: restaurantBasics.id }
      }
    }
  });

  await prisma.trainingModule.update({
    where: { id: jobSearchModule.id },
    data: {
      prerequisites: {
        connect: { id: workerBasics.id }
      }
    }
  });

  console.log('Training modules and materials seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

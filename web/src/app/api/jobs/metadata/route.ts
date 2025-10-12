import { NextResponse } from 'next/server'

// Job metadata and enums endpoint
export async function GET() {
  try {
    const metadata = {
      jobTypes: [
        { value: 'SINGLE_SHIFT', label: 'Single Shift', description: 'One-time shift work' },
        { value: 'WEEKLY_SHORT_TERM', label: 'Weekly Short Term', description: 'Weekly recurring shifts for short periods' },
        { value: 'PERMANENT', label: 'Permanent Position', description: 'Long-term employment opportunity' }
      ],
      skillLevels: [
        { value: 'NO_EXPERIENCE', label: 'No Experience Required', description: 'Perfect for beginners' },
        { value: 'BEGINNER', label: 'Beginner', description: 'Basic knowledge required' },
        { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Some experience preferred' },
        { value: 'ADVANCED', label: 'Advanced', description: 'Significant experience required' },
        { value: 'EXPERT', label: 'Expert', description: 'Master level skills required' }
      ],
      urgencyLevels: [
        { value: 'LOW', label: 'Low Priority', description: 'Can fill when convenient' },
        { value: 'MEDIUM', label: 'Medium Priority', description: 'Standard timeline' },
        { value: 'HIGH', label: 'High Priority', description: 'Need to fill soon' },
        { value: 'URGENT', label: 'Urgent', description: 'Need to fill immediately' }
      ],
      jobStatuses: [
        { value: 'ACTIVE', label: 'Active', description: 'Currently accepting applications' },
        { value: 'PAUSED', label: 'Paused', description: 'Temporarily not accepting applications' },
        { value: 'FILLED', label: 'Filled', description: 'Position has been filled' },
        { value: 'CANCELLED', label: 'Cancelled', description: 'Job posting cancelled' }
      ],
      commonSkills: [
        'Customer Service',
        'Food Safety Certification',
        'POS Systems',
        'Cash Handling',
        'Bartending',
        'Food Preparation',
        'Kitchen Experience',
        'Server Experience',
        'Host/Hostess',
        'Dishwashing',
        'Cleaning',
        'Team Leadership',
        'Inventory Management',
        'Multi-tasking',
        'Communication Skills'
      ],
      commonCertifications: [
        'Food Handler License',
        'ServSafe Certification',
        'Alcohol Service License (RBS)',
        'First Aid/CPR',
        'Manager Food Safety',
        'Allergen Awareness',
        'HACCP Training'
      ],
      workDays: [
        'MONDAY',
        'TUESDAY', 
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
      ]
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching job metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
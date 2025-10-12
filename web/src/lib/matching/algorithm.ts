/**
 * Advanced Candidate Matching Algorithm
 * 
 * This module provides intelligent matching between job postings and candidates
 * based on skills, experience, availability, location, and other factors.
 */

export interface JobRequirements {
  skillRequirements: string[]
  skillLevel: string
  experienceMonths?: number
  hourlyRate: number
  workDays?: string[]
  shiftStartTime?: string
  shiftEndTime?: string
  locationAddress?: string
  urgency: string
}

export interface CandidateProfile {
  id: string
  skills: string[]
  experience: string
  hourlyRate?: number
  availability: string
  averageRating?: number
  totalShiftsCompleted: number
  bio?: string
  locationAddress?: string
}

export interface MatchScore {
  candidateId: string
  overallScore: number
  breakdown: {
    skillsMatch: number
    experienceMatch: number
    availabilityMatch: number
    rateMatch: number
    locationMatch: number
    reliabilityScore: number
  }
  matchReasons: string[]
  concerns: string[]
}

/**
 * Calculate skill match percentage
 */
export function calculateSkillsMatch(jobSkills: string[], candidateSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 1.0
  if (!candidateSkills || candidateSkills.length === 0) return 0.0
  
  const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase().trim())
  const normalizedCandidateSkills = candidateSkills.map(skill => skill.toLowerCase().trim())
  
  const matchedSkills = normalizedJobSkills.filter(jobSkill => 
    normalizedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )
  )
  
  return matchedSkills.length / normalizedJobSkills.length
}

/**
 * Calculate experience level match
 */
export function calculateExperienceMatch(jobSkillLevel: string, candidateExperience: string, shiftsCompleted: number): number {
  // Skill level hierarchy
  const skillLevels = {
    'NO_EXPERIENCE': 0,
    'BEGINNER': 1,
    'INTERMEDIATE': 2,
    'ADVANCED': 3,
    'EXPERT': 4
  }
  
  const requiredLevel = skillLevels[jobSkillLevel as keyof typeof skillLevels] || 0
  
  // Estimate candidate level based on experience description and shifts completed
  let candidateLevel = 0
  
  if (candidateExperience) {
    const exp = candidateExperience.toLowerCase()
    if (exp.includes('expert') || exp.includes('certified') || exp.includes('manager')) candidateLevel = 4
    else if (exp.includes('advanced') || exp.includes('lead') || exp.includes('senior')) candidateLevel = 3
    else if (exp.includes('intermediate') || exp.includes('experienced')) candidateLevel = 2
    else if (exp.includes('beginner') || exp.includes('entry') || exp.includes('basic')) candidateLevel = 1
  }
  
  // Adjust based on shifts completed
  if (shiftsCompleted > 50) candidateLevel = Math.max(candidateLevel, 3)
  else if (shiftsCompleted > 20) candidateLevel = Math.max(candidateLevel, 2)
  else if (shiftsCompleted > 5) candidateLevel = Math.max(candidateLevel, 1)
  
  // Calculate match score
  if (candidateLevel >= requiredLevel) {
    return 1.0 // Perfect match or overqualified
  } else {
    return Math.max(0, candidateLevel / requiredLevel) // Partial match
  }
}

/**
 * Calculate availability match based on work days and times
 */
export function calculateAvailabilityMatch(jobWorkDays?: string[], candidateAvailability?: string): number {
  if (!jobWorkDays || jobWorkDays.length === 0 || !candidateAvailability) return 0.7 // Neutral score
  
  const availability = candidateAvailability.toLowerCase()
  
  // Check for general availability keywords
  if (availability.includes('flexible') || availability.includes('any time') || availability.includes('available')) {
    return 1.0
  }
  
  // Check specific days
  const dayMatches = jobWorkDays.filter(day => 
    availability.includes(day.toLowerCase())
  ).length
  
  if (dayMatches === 0) {
    // Check for weekend/weekday patterns
    const hasWeekends = jobWorkDays.some(day => ['SATURDAY', 'SUNDAY'].includes(day))
    const hasWeekdays = jobWorkDays.some(day => ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day))
    
    if (hasWeekends && availability.includes('weekend')) return 0.8
    if (hasWeekdays && (availability.includes('weekday') || availability.includes('monday') || availability.includes('tuesday'))) return 0.8
    
    return 0.3 // Low match
  }
  
  return Math.min(1.0, dayMatches / jobWorkDays.length + 0.2) // Bonus for partial matches
}

/**
 * Calculate hourly rate compatibility
 */
export function calculateRateMatch(jobRate: number, candidateRate?: number): number {
  if (!candidateRate) return 0.8 // Neutral if rate not specified
  
  const difference = Math.abs(jobRate - candidateRate)
  const averageRate = (jobRate + candidateRate) / 2
  const percentDifference = difference / averageRate
  
  // Perfect match if within 10%
  if (percentDifference <= 0.1) return 1.0
  
  // Good match if within 25% 
  if (percentDifference <= 0.25) return 0.8
  
  // Acceptable if job pays more than candidate asks
  if (jobRate >= candidateRate) return 0.9
  
  // Poor match if job pays significantly less
  if (percentDifference > 0.5) return 0.2
  
  return Math.max(0.2, 1 - percentDifference)
}

/**
 * Calculate location proximity (simplified - can be enhanced with actual coordinates)
 */
export function calculateLocationMatch(jobLocation?: string, candidateLocation?: string): number {
  if (!jobLocation || !candidateLocation) return 0.7 // Neutral score
  
  const job = jobLocation.toLowerCase()
  const candidate = candidateLocation.toLowerCase()
  
  // Exact match
  if (job === candidate) return 1.0
  
  // Check for city/area matches
  const jobParts = job.split(/,|\s+/)
  const candidateParts = candidate.split(/,|\s+/)
  
  const commonParts = jobParts.filter(part => 
    candidateParts.some(cPart => cPart.includes(part) || part.includes(cPart))
  )
  
  if (commonParts.length > 0) return 0.8
  
  return 0.5 // Default for different locations
}

/**
 * Calculate reliability score based on ratings and completion history
 */
export function calculateReliabilityScore(averageRating?: number, totalShifts: number = 0): number {
  let score = 0.5 // Base score
  
  // Rating contribution (40% of reliability)
  if (averageRating) {
    score += (averageRating / 5) * 0.4
  }
  
  // Experience contribution (30% of reliability)
  const experienceScore = Math.min(1.0, totalShifts / 20) // Maxes out at 20 shifts
  score += experienceScore * 0.3
  
  // Profile completeness contribution (30% of reliability)
  score += 0.3 // Assume complete profile for now
  
  return Math.min(1.0, score)
}

/**
 * Main matching function that combines all factors
 */
export function calculateCandidateMatch(job: JobRequirements, candidate: CandidateProfile): MatchScore {
  // Calculate individual scores
  const skillsMatch = calculateSkillsMatch(job.skillRequirements, candidate.skills)
  const experienceMatch = calculateExperienceMatch(job.skillLevel, candidate.experience, candidate.totalShiftsCompleted)
  const availabilityMatch = calculateAvailabilityMatch(job.workDays, candidate.availability)
  const rateMatch = calculateRateMatch(job.hourlyRate, candidate.hourlyRate)
  const locationMatch = calculateLocationMatch(job.locationAddress, candidate.locationAddress)
  const reliabilityScore = calculateReliabilityScore(candidate.averageRating, candidate.totalShiftsCompleted)
  
  // Weighted overall score
  const weights = {
    skills: 0.25,
    experience: 0.20,
    availability: 0.20,
    rate: 0.15,
    location: 0.10,
    reliability: 0.10
  }
  
  const overallScore = 
    skillsMatch * weights.skills +
    experienceMatch * weights.experience +
    availabilityMatch * weights.availability +
    rateMatch * weights.rate +
    locationMatch * weights.location +
    reliabilityScore * weights.reliability
  
  // Generate match reasons and concerns
  const matchReasons: string[] = []
  const concerns: string[] = []
  
  if (skillsMatch >= 0.8) matchReasons.push('Strong skill match')
  else if (skillsMatch < 0.3) concerns.push('Limited skill match')
  
  if (experienceMatch >= 0.8) matchReasons.push('Experience level fits well')
  else if (experienceMatch < 0.5) concerns.push('May need training')
  
  if (availabilityMatch >= 0.8) matchReasons.push('Good availability match')
  else if (availabilityMatch < 0.5) concerns.push('Availability mismatch')
  
  if (rateMatch >= 0.8) matchReasons.push('Rate expectations align')
  else if (rateMatch < 0.5) concerns.push('Rate expectations differ')
  
  if (reliabilityScore >= 0.8) matchReasons.push('Highly reliable candidate')
  
  return {
    candidateId: candidate.id,
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown: {
      skillsMatch: Math.round(skillsMatch * 100) / 100,
      experienceMatch: Math.round(experienceMatch * 100) / 100,
      availabilityMatch: Math.round(availabilityMatch * 100) / 100,
      rateMatch: Math.round(rateMatch * 100) / 100,
      locationMatch: Math.round(locationMatch * 100) / 100,
      reliabilityScore: Math.round(reliabilityScore * 100) / 100
    },
    matchReasons,
    concerns
  }
}

/**
 * Batch matching for multiple candidates
 */
export function matchCandidatesForJob(job: JobRequirements, candidates: CandidateProfile[]): MatchScore[] {
  return candidates
    .map(candidate => calculateCandidateMatch(job, candidate))
    .sort((a, b) => b.overallScore - a.overallScore) // Sort by best match first
}
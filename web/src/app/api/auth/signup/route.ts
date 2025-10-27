import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/UserService'
import { withErrorHandling, validateRequiredFields, handleServiceResult } from '@/lib/middleware/apiResponse'
import { Role } from '@prisma/client'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { 
    email, 
    password, 
    name, 
    role, 
    phone, 
    businessName,
    preferredWorkTypes,
    experienceLevel,
    acceptTerms,
    acceptPrivacy,
    receiveNotifications 
  } = await request.json() 

  // Validate required fields
  const validationError = validateRequiredFields({ email, password, name, role }, [ 
    'email', 'password', 'name', 'role'
  ])

  if (validationError) {
    return handleServiceResult({
      success: false,
      error: validationError
    })
  }

  // Validate legal agreements
  if (!acceptTerms) {
    return handleServiceResult({
      success: false,
      error: {
        code: 'TERMS_NOT_ACCEPTED',
        message: 'You must accept the Terms & Conditions',
        field: 'acceptTerms'
      }
    })
  }

  if (!acceptPrivacy) {
    return handleServiceResult({
      success: false,
      error: {
        code: 'PRIVACY_NOT_ACCEPTED',
        message: 'You must accept the Privacy Policy',
        field: 'acceptPrivacy'
      }
    })
  }

  // Additional validation for restaurant owners
  if (role === 'RESTAURANT_OWNER' && !businessName) {
    return handleServiceResult({
      success: false,
      error: {
        code: 'MISSING_BUSINESS_NAME',
        message: 'Business name is required for restaurant owners',
        field: 'businessName'
      }
    })
  }

  // Additional validation for workers
  if (role === 'WORKER' && (!preferredWorkTypes || preferredWorkTypes.length === 0)) {
    return handleServiceResult({
      success: false,
      error: {
        code: 'MISSING_WORK_TYPES',
        message: 'Please select at least one preferred work type',
        field: 'preferredWorkTypes'
      }
    })
  }

  // Create user using the service layer
  const userService = new UserService()
  const result = await userService.registerUser({
    email,
    password,
    role: role as Role,
    name,
    phone: phone || undefined
  }, {
    businessName: businessName || undefined,
    preferredWorkTypes: preferredWorkTypes || [],
    experienceLevel: experienceLevel || 'entry',
    receiveNotifications: receiveNotifications !== false
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        email: result.data.email,
        role: result.data.role,
        name: result.data.name
      },
      message: 'Account created successfully! Please check your email to verify your account.'
    }, { status: 201 })
  }

  return handleServiceResult(result)
})

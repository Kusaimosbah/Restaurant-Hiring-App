import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/UserService'
import { withErrorHandling, validateRequiredFields, handleServiceResult } from '@/lib/middleware/apiResponse'
import { Role } from '@prisma/client'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password, name, role, phone, businessName } = await request.json()

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

  // Create user using the service layer
  const userService = new UserService()
  const result = await userService.registerUser({
    email,
    password,
    role: role as Role,
    profile: {
      create: {
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        phone: phone || null,
        businessName: role === 'RESTAURANT_OWNER' ? businessName : null
      }
    }
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      data: {
        user: result.data,
        message: 'Account created successfully. Please check your email to verify your account.'
      }
    })
  }

  return handleServiceResult(result)
})
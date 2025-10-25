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
    name,
    phone: phone || undefined
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        email: result.data.email,
        role: result.data.role,
        name: result.data.name
      }
    }, { status: 201 })
  }

  return handleServiceResult(result)
})

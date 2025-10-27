'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'WORKER',
    phone: '',
    businessName: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
    acceptPrivacy: false,
    preferredWorkTypes: [] as string[],
    experienceLevel: 'entry',
    receiveNotifications: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  })

  // Set role from URL parameter
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'RESTAURANT_OWNER' || roleParam === 'WORKER') {
      setFormData(prev => ({ ...prev, role: roleParam }))
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Update password strength in real-time
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleWorkTypeChange = (workType: string) => {
    setFormData(prev => ({
      ...prev,
      preferredWorkTypes: prev.preferredWorkTypes.includes(workType)
        ? prev.preferredWorkTypes.filter(type => type !== workType)
        : [...prev.preferredWorkTypes, workType]
    }))
    
    if (errors.preferredWorkTypes) {
      setErrors(prev => ({ ...prev, preferredWorkTypes: '' }))
    }
  }

  const checkPasswordStrength = (password: string) => {
    let score = 0
    let feedback = ''

    if (password.length < 8) {
      feedback = 'Password too short'
      return { score, feedback }
    }

    // Length scoring
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    // Common patterns penalty
    if (/(.)\1{2,}/.test(password)) score -= 1
    if (/123|abc|qwe|password/i.test(password)) score -= 2

    // Feedback messages
    const feedbacks = {
      0: 'Very weak',
      1: 'Weak',
      2: 'Fair', 
      3: 'Good',
      4: 'Strong',
      5: 'Very strong',
      6: 'Excellent'
    }

    feedback = feedbacks[Math.max(0, Math.min(6, score)) as keyof typeof feedbacks]
    return { score: Math.max(0, Math.min(6, score)), feedback }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email address is too long'
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^[\+]?[\d\s\(\)\-\.]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const strength = checkPasswordStrength(formData.password)
      if (strength.score < 3) {
        newErrors.password = `Password is too weak. Must be at least 12 characters with uppercase, lowercase, numbers, and special characters.`
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Role-specific validation
    if (formData.role === 'RESTAURANT_OWNER') {
      if (!formData.businessName) {
        newErrors.businessName = 'Business name is required for restaurant owners'
      } else if (formData.businessName.length < 2) {
        newErrors.businessName = 'Business name must be at least 2 characters'
      }
    }

    if (formData.role === 'WORKER' && formData.preferredWorkTypes.length === 0) {
      newErrors.preferredWorkTypes = 'Please select at least one work type'
    }

    // Terms and privacy validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms & Conditions'
    }

    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'You must accept the Privacy Policy'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          phone: formData.phone || undefined,
          businessName: formData.businessName || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success - show success message then redirect
        setSuccess(true)
        setErrors({})
        setTimeout(() => {
          router.push('/auth/signin?message=Account created successfully! You can now sign in.')
        }, 2000)
      } else {
        // Show error message
        setErrors({ general: data.error || 'Failed to create account' })
        setSuccess(false)
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Account created successfully! Please check your email to verify your account.
            </div>
          )}
          
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your phone number (optional)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Account Type Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Type</h3>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  I am a *
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="WORKER">Worker (Server, Chef, Bartender, etc.)</option>
                  <option value="RESTAURANT_OWNER">Restaurant Owner/Manager</option>
                </select>
              </div>

              {formData.role === 'RESTAURANT_OWNER' && (
                <div className="mt-4">
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your restaurant/business name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                </div>
              )}

              {formData.role === 'WORKER' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Work Types * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Server/Waitstaff',
                      'Chef/Cook',
                      'Bartender',
                      'Host/Hostess',
                      'Kitchen Staff',
                      'Dishwasher',
                      'Manager',
                      'Barista'
                    ].map((workType) => (
                      <label key={workType} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.preferredWorkTypes.includes(workType)}
                          onChange={() => handleWorkTypeChange(workType)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{workType}</span>
                      </label>
                    ))}
                  </div>
                  {errors.preferredWorkTypes && <p className="mt-1 text-sm text-red-600">{errors.preferredWorkTypes}</p>}

                  <div className="mt-4">
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                    >
                      <option value="entry">Entry Level (0-1 years)</option>
                      <option value="intermediate">Intermediate (2-5 years)</option>
                      <option value="experienced">Experienced (5+ years)</option>
                      <option value="expert">Expert (10+ years)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score < 2 ? 'text-red-600' :
                          passwordStrength.score < 4 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.score < 2 ? 'bg-red-500' :
                            passwordStrength.score < 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 12 characters with uppercase, lowercase, numbers, and special characters
                  </p>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Legal Agreement Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Agreement</h3>
              
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I accept the{' '}
                    <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank">
                      Terms & Conditions
                    </Link>{' '}
                    *
                  </span>
                </label>
                {errors.acceptTerms && <p className="ml-6 text-sm text-red-600">{errors.acceptTerms}</p>}

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptPrivacy"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                    checked={formData.acceptPrivacy}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I accept the{' '}
                    <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank">
                      Privacy Policy
                    </Link>{' '}
                    *
                  </span>
                </label>
                {errors.acceptPrivacy && <p className="ml-6 text-sm text-red-600">{errors.acceptPrivacy}</p>}

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="receiveNotifications"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                    checked={formData.receiveNotifications}
                    onChange={handleChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I would like to receive email notifications about job opportunities and platform updates
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
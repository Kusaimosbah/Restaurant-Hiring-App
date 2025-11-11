import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import configuration
const i18nConfig = require('../next-i18next.config');

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...i18nConfig,
    lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en',
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },

    // Resources for initial load (English)
    resources: {
      en: {
        common: {
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add',
          search: 'Search',
          filter: 'Filter',
          clear: 'Clear',
          next: 'Next',
          previous: 'Previous',
          submit: 'Submit',
          confirm: 'Confirm',
          yes: 'Yes',
          no: 'No',
        },
        navigation: {
          dashboard: 'Dashboard',
          jobs: 'Jobs',
          applications: 'Applications',
          messages: 'Messages',
          profile: 'Profile',
          settings: 'Settings',
          logout: 'Logout',
          home: 'Home',
          about: 'About',
          contact: 'Contact',
          help: 'Help',
        },
        auth: {
          signIn: 'Sign In',
          signUp: 'Sign Up',
          signOut: 'Sign Out',
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          forgotPassword: 'Forgot Password?',
          resetPassword: 'Reset Password',
          verifyEmail: 'Verify Email',
          fullName: 'Full Name',
          phone: 'Phone Number',
          role: 'Role',
          worker: 'Worker',
          employer: 'Employer',
          admin: 'Administrator',
        },
        jobs: {
          title: 'Job Title',
          description: 'Job Description',
          requirements: 'Requirements',
          hourlyRate: 'Hourly Rate',
          startDate: 'Start Date',
          endDate: 'End Date',
          location: 'Location',
          category: 'Category',
          status: 'Status',
          active: 'Active',
          inactive: 'Inactive',
          closed: 'Closed',
          maxWorkers: 'Maximum Workers',
          createJob: 'Create Job',
          editJob: 'Edit Job',
          applyJob: 'Apply for Job',
          viewDetails: 'View Details',
        },
        applications: {
          status: 'Application Status',
          pending: 'Pending',
          reviewed: 'Reviewed',
          interviewed: 'Interviewed',
          hired: 'Hired',
          rejected: 'Rejected',
          appliedAt: 'Applied At',
          respondedAt: 'Responded At',
          coverLetter: 'Cover Letter',
          resume: 'Resume',
          withdraw: 'Withdraw Application',
          viewApplication: 'View Application',
        },
        dashboard: {
          overview: 'Overview',
          stats: 'Statistics',
          recentActivity: 'Recent Activity',
          notifications: 'Notifications',
          quickActions: 'Quick Actions',
          performance: 'Performance',
          analytics: 'Analytics',
          reports: 'Reports',
        },
        messages: {
          sendMessage: 'Send Message',
          typeMessage: 'Type a message...',
          attachment: 'Attachment',
          markAsRead: 'Mark as Read',
          delete: 'Delete Message',
          reply: 'Reply',
          forward: 'Forward',
          conversation: 'Conversation',
          newConversation: 'New Conversation',
        },
        profile: {
          personalInfo: 'Personal Information',
          workExperience: 'Work Experience',
          education: 'Education',
          skills: 'Skills',
          certifications: 'Certifications',
          availability: 'Availability',
          preferences: 'Preferences',
          documents: 'Documents',
          updateProfile: 'Update Profile',
          uploadPhoto: 'Upload Photo',
        },
        errors: {
          required: 'This field is required',
          invalidEmail: 'Invalid email address',
          passwordMismatch: 'Passwords do not match',
          minimumLength: 'Minimum {{count}} characters required',
          networkError: 'Network error. Please try again.',
          unauthorized: 'You are not authorized to perform this action',
          notFound: 'The requested resource was not found',
          serverError: 'Internal server error. Please try again later.',
        },
        success: {
          profileUpdated: 'Profile updated successfully',
          jobCreated: 'Job created successfully',
          applicationSubmitted: 'Application submitted successfully',
          messageSent: 'Message sent successfully',
          passwordReset: 'Password reset email sent',
          emailVerified: 'Email verified successfully',
        },
      },
    },
  });

export default i18n;
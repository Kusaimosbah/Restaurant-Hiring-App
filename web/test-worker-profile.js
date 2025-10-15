/**
 * Worker Profile API Test Script
 * 
 * This script tests the Worker Profile API endpoints for the Restaurant Hiring App.
 * It simulates API calls to verify that the endpoints are working correctly.
 * 
 * Usage: node test-worker-profile.js
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/worker`;
const COOKIE = ''; // Add your session cookie here after logging in as a worker

// Test endpoints
const endpoints = {
  profile: `${API_BASE}/profile`,
  skills: `${API_BASE}/skills`,
  certifications: `${API_BASE}/certifications`,
  documents: `${API_BASE}/documents`,
  documentUpload: `${API_BASE}/documents/upload`,
};

// Headers with authentication
const headers = {
  'Content-Type': 'application/json',
  'Cookie': COOKIE,
};

// Helper function for making API requests
async function apiRequest(url, method = 'GET', body = null, customHeaders = {}) {
  const options = {
    method,
    headers: { ...headers, ...customHeaders },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`${method} ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('-----------------------------------');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error with ${method} ${url}:`, error);
    return { status: 500, error };
  }
}

// Test worker profile
async function testWorkerProfile() {
  console.log('\n=== Testing Worker Profile API ===\n');

  // Get profile
  await apiRequest(endpoints.profile);

  // Update profile
  const profileData = {
    title: 'Senior Server',
    bio: 'Experienced server with 5+ years in fine dining establishments',
    yearsOfExperience: 5,
    hourlyRate: 22.5,
    contactEmail: 'jane.worker@example.com',
    contactPhone: '+1-555-123-4567',
    preferredContactMethod: 'Email',
    address: '123 Worker St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94110',
  };
  
  await apiRequest(endpoints.profile, 'PUT', profileData);
}

// Test worker skills
async function testWorkerSkills() {
  console.log('\n=== Testing Worker Skills API ===\n');

  // Get skills
  const { data: skills } = await apiRequest(endpoints.skills);

  // Add skill
  const newSkill = {
    name: 'Menu Planning',
    experienceLevel: 'INTERMEDIATE',
    yearsOfExperience: 2.5,
  };
  
  const { data: addedSkill } = await apiRequest(endpoints.skills, 'POST', newSkill);

  // Update skill (if any skills exist)
  if (addedSkill && addedSkill.id) {
    const updateData = {
      experienceLevel: 'ADVANCED',
      yearsOfExperience: 3,
    };
    
    await apiRequest(`${endpoints.skills}/${addedSkill.id}`, 'PUT', updateData);
  }

  // Delete skill (if any skills exist)
  if (addedSkill && addedSkill.id) {
    await apiRequest(`${endpoints.skills}/${addedSkill.id}`, 'DELETE');
  }
}

// Test worker certifications
async function testWorkerCertifications() {
  console.log('\n=== Testing Worker Certifications API ===\n');

  // Get certifications
  const { data: certifications } = await apiRequest(endpoints.certifications);

  // Add certification
  const newCertification = {
    name: 'Advanced Food Safety',
    issuingOrganization: 'ServSafe',
    issueDate: '2023-01-15',
    expirationDate: '2026-01-15',
    credentialId: 'SS-987654',
    verificationUrl: 'https://servsafe.com/verify/SS-987654',
  };
  
  const { data: addedCert } = await apiRequest(endpoints.certifications, 'POST', newCertification);

  // Update certification (if any certifications exist)
  if (addedCert && addedCert.id) {
    const updateData = {
      name: 'Advanced Food Safety & Hygiene',
      expirationDate: '2027-01-15',
    };
    
    await apiRequest(`${endpoints.certifications}/${addedCert.id}`, 'PUT', updateData);
  }

  // Delete certification (if any certifications exist)
  if (addedCert && addedCert.id) {
    await apiRequest(`${endpoints.certifications}/${addedCert.id}`, 'DELETE');
  }
}

// Test worker documents
async function testWorkerDocuments() {
  console.log('\n=== Testing Worker Documents API ===\n');

  // Get documents
  const { data: documents } = await apiRequest(endpoints.documents);

  // Test document upload (simulated)
  console.log('Simulating document upload...');
  
  // In a real test, you would upload an actual file
  // const form = new FormData();
  // form.append('file', fs.createReadStream('./test-resume.pdf'));
  // const uploadResponse = await fetch(endpoints.documentUpload, {
  //   method: 'POST',
  //   body: form,
  //   headers: { 'Cookie': COOKIE },
  // });
  // const uploadData = await uploadResponse.json();
  
  // Simulate upload response
  const uploadData = { url: 'https://example.com/documents/test-resume.pdf' };
  console.log('Upload response:', uploadData);

  // Add document
  const newDocument = {
    name: 'My Resume',
    documentType: 'RESUME',
    filePath: uploadData.url,
    notes: 'Latest version of my resume',
  };
  
  const { data: addedDoc } = await apiRequest(endpoints.documents, 'POST', newDocument);

  // Update document (if any documents exist)
  if (addedDoc && addedDoc.id) {
    const updateData = {
      name: 'Updated Resume',
      notes: 'Updated with recent experience',
    };
    
    await apiRequest(`${endpoints.documents}/${addedDoc.id}`, 'PUT', updateData);
  }

  // Delete document (if any documents exist)
  if (addedDoc && addedDoc.id) {
    await apiRequest(`${endpoints.documents}/${addedDoc.id}`, 'DELETE');
  }
}

// Run all tests
async function runTests() {
  if (!COOKIE) {
    console.log('\n⚠️ Warning: No authentication cookie provided. API calls will likely fail.\n');
    console.log('To test with authentication:');
    console.log('1. Log in to the app in your browser as a worker');
    console.log('2. Copy the session cookie from your browser\'s developer tools');
    console.log('3. Update the COOKIE constant in this script\n');
  }

  try {
    await testWorkerProfile();
    await testWorkerSkills();
    await testWorkerCertifications();
    await testWorkerDocuments();
    
    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error, '\n');
  }
}

// Run the tests
runTests();

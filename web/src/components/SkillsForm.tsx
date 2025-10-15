'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface Skill {
  id: string;
  name: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience: number | null;
}

interface SkillsFormProps {
  initialSkills?: Skill[];
  onAddSkill: (skill: Omit<Skill, 'id'>) => Promise<boolean>;
  onUpdateSkill: (id: string, skill: Partial<Omit<Skill, 'id'>>) => Promise<boolean>;
  onDeleteSkill: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function SkillsForm({
  initialSkills = [],
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
  isLoading = false,
}: SkillsFormProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({
    name: '',
    experienceLevel: 'INTERMEDIATE' as const,
    yearsOfExperience: '',
  });
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load initial skills when component mounts or initialSkills changes
  useEffect(() => {
    if (initialSkills) {
      setSkills(initialSkills);
    }
  }, [initialSkills]);

  // Handle form field changes for new skill
  const handleNewSkillChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form field changes for editing existing skill
  const handleEditSkillChange = (id: string, field: string, value: string) => {
    setSkills(prev => 
      prev.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
    
    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle adding a new skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!newSkill.name.trim()) {
      newErrors.name = 'Skill name is required';
    }
    
    if (newSkill.yearsOfExperience && isNaN(Number(newSkill.yearsOfExperience))) {
      newErrors.yearsOfExperience = 'Years of experience must be a number';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format data for submission
    const submissionData = {
      name: newSkill.name,
      experienceLevel: newSkill.experienceLevel,
      yearsOfExperience: newSkill.yearsOfExperience ? parseFloat(newSkill.yearsOfExperience) : null,
    };
    
    // Submit form
    const success = await onAddSkill(submissionData);
    
    if (success) {
      setSuccessMessage('Skill added successfully!');
      // Reset form
      setNewSkill({
        name: '',
        experienceLevel: 'INTERMEDIATE',
        yearsOfExperience: '',
      });
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle updating an existing skill
  const handleUpdateSkill = async (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    
    // Format data for submission
    const submissionData = {
      name: skill.name,
      experienceLevel: skill.experienceLevel,
      yearsOfExperience: skill.yearsOfExperience,
    };
    
    // Submit form
    const success = await onUpdateSkill(id, submissionData);
    
    if (success) {
      setSuccessMessage('Skill updated successfully!');
      setEditingSkill(null);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle deleting a skill
  const handleDeleteSkill = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      const success = await onDeleteSkill(id);
      
      if (success) {
        setSuccessMessage('Skill deleted successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };

  // Get color class for experience level
  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-blue-100 text-blue-800';
      case 'INTERMEDIATE':
        return 'bg-green-100 text-green-800';
      case 'ADVANCED':
        return 'bg-purple-100 text-purple-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format experience level for display
  const formatExperienceLevel = (level: string) => {
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Add New Skill Form */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Skill</h3>
        
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Skill Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newSkill.name}
                onChange={handleNewSkillChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. Customer Service"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={newSkill.experienceLevel}
                onChange={handleNewSkillChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={newSkill.yearsOfExperience}
                onChange={handleNewSkillChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.yearsOfExperience ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. 2.5"
              />
              {errors.yearsOfExperience && (
                <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Skill'}
            </Button>
          </div>
        </form>
      </div>

      {/* Skills List */}
      <div className="bg-white rounded-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Your Skills</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional skills and experience levels.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {skills.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              You haven't added any skills yet. Add your first skill above.
            </div>
          ) : (
            skills.map(skill => (
              <div key={skill.id} className="p-4">
                {editingSkill === skill.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => handleEditSkillChange(skill.id, 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Experience Level
                        </label>
                        <select
                          value={skill.experienceLevel}
                          onChange={(e) => handleEditSkillChange(skill.id, 'experienceLevel', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                          <option value="EXPERT">Expert</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="text"
                          value={skill.yearsOfExperience || ''}
                          onChange={(e) => handleEditSkillChange(
                            skill.id, 
                            'yearsOfExperience', 
                            e.target.value ? e.target.value : null
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingSkill(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => handleUpdateSkill(skill.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900">{skill.name}</div>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceLevelColor(skill.experienceLevel)}`}>
                        {formatExperienceLevel(skill.experienceLevel)}
                      </span>
                      {skill.yearsOfExperience && (
                        <span className="ml-2 text-sm text-gray-500">
                          {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingSkill(skill.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
    </div>
  );
}

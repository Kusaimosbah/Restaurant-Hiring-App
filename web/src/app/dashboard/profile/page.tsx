'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurant?: {
    id: string;
    name: string;
    address: string;
    description?: string;
    phone?: string;
    email?: string;
  };
  workerProfile?: {
    id: string;
    bio?: string;
    experience?: string;
    skills: string[];
    hourlyRate?: number;
    availability?: string;
  };
}

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfilePageContent />
    </SessionProvider>
  );
}

function ProfilePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // Restaurant fields
    restaurantName: '',
    restaurantAddress: '',
    restaurantDescription: '',
    restaurantPhone: '',
    restaurantEmail: '',
    // Worker fields
    bio: '',
    experience: '',
    skills: [] as string[],
    hourlyRate: 0,
    availability: '',
  });

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadProfile();
  }, [session, status, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name,
          email: data.email,
          restaurantName: data.restaurant?.name || '',
          restaurantAddress: data.restaurant?.address || '',
          restaurantDescription: data.restaurant?.description || '',
          restaurantPhone: data.restaurant?.phone || '',
          restaurantEmail: data.restaurant?.email || '',
          bio: data.workerProfile?.bio || '',
          experience: data.workerProfile?.experience || '',
          skills: data.workerProfile?.skills || [],
          hourlyRate: data.workerProfile?.hourlyRate || 0,
          availability: data.workerProfile?.availability || '',
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditing(false);
        loadProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAddSkill = () => {
    const skill = prompt('Enter a skill:');
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Profile Management"
          subtitle="Manage your account and profile information"
        />
        
        <div className="p-6">
          <div className="max-w-4xl">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Profile Information</CardTitle>
                  <Button 
                    onClick={() => setEditing(!editing)}
                    variant={editing ? "outline" : "primary"}
                  >
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {isAdmin ? (
                      /* Restaurant Information */
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Restaurant Name
                              </label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                value={formData.restaurantName}
                                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                              </label>
                              <input
                                type="tel"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                value={formData.restaurantPhone}
                                onChange={(e) => setFormData({ ...formData, restaurantPhone: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={formData.restaurantAddress}
                              onChange={(e) => setFormData({ ...formData, restaurantAddress: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Restaurant Email
                            </label>
                            <input
                              type="email"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={formData.restaurantEmail}
                              onChange={(e) => setFormData({ ...formData, restaurantEmail: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              rows={3}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={formData.restaurantDescription}
                              onChange={(e) => setFormData({ ...formData, restaurantDescription: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Worker Information */
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Worker Profile</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bio
                            </label>
                            <textarea
                              rows={3}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={formData.bio}
                              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                              placeholder="Tell employers about yourself..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Experience
                            </label>
                            <textarea
                              rows={3}
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={formData.experience}
                              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                              placeholder="Describe your work experience..."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Desired Hourly Rate ($)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                value={formData.hourlyRate}
                                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Availability
                              </label>
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                value={formData.availability}
                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                placeholder="e.g., Weekends, Evenings, Full-time"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Skills
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {formData.skills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <Button type="button" onClick={handleAddSkill} variant="outline" size="sm">
                              + Add Skill
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button type="submit">Save Changes</Button>
                      <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <p className="text-gray-900">{profile?.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{profile?.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <p className="text-gray-900">{isAdmin ? 'Restaurant Owner' : 'Worker'}</p>
                        </div>
                      </div>
                    </div>

                    {isAdmin && profile?.restaurant ? (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                            <p className="text-gray-900">{profile.restaurant.name || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-gray-900">{profile.restaurant.phone || 'Not set'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <p className="text-gray-900">{profile.restaurant.address || 'Not set'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Restaurant Email</label>
                            <p className="text-gray-900">{profile.restaurant.email || 'Not set'}</p>
                          </div>
                          {profile.restaurant.description && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Description</label>
                              <p className="text-gray-900">{profile.restaurant.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : !isAdmin && profile?.workerProfile && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Worker Profile</h3>
                        <div className="space-y-4">
                          {profile.workerProfile.bio && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Bio</label>
                              <p className="text-gray-900">{profile.workerProfile.bio}</p>
                            </div>
                          )}
                          {profile.workerProfile.experience && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Experience</label>
                              <p className="text-gray-900">{profile.workerProfile.experience}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Desired Hourly Rate</label>
                              <p className="text-gray-900">
                                {profile.workerProfile.hourlyRate ? `$${profile.workerProfile.hourlyRate}/hour` : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Availability</label>
                              <p className="text-gray-900">{profile.workerProfile.availability || 'Not set'}</p>
                            </div>
                          </div>
                          {profile.workerProfile.skills.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                              <div className="flex flex-wrap gap-2">
                                {profile.workerProfile.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
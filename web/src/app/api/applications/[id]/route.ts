import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationTriggers } from '@/lib/services/NotificationTriggers';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;

    // Get application with detailed information
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        OR: [
          // Restaurant owner can see applications for their jobs
          {
            job: {
              restaurant: {
                ownerId: session.user.id
              }
            }
          },
          // Worker can see their own applications
          {
            worker: {
              userId: session.user.id
            }
          }
        ]
      },
      include: {
        job: {
          include: {
            restaurant: {
              include: {
                address: true,
                photos: true
              }
            }
          }
        },
        worker: {
          include: {
            user: true,
            workerSkills: true,
            certifications: true,
            documents: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            recipient: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        shiftAssignment: true
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Format response with comprehensive application details
    const response = {
      id: application.id,
      status: application.status,
      appliedAt: application.appliedAt,
      respondedAt: application.respondedAt,
      responseNote: application.responseNote,
      coverLetterUrl: application.coverLetterUrl,
      
      // Job details
      job: {
        id: application.job.id,
        title: application.job.title,
        description: application.job.description,
        requirements: application.job.requirements,
        hourlyRate: application.job.hourlyRate,
        startDate: application.job.startDate,
        endDate: application.job.endDate,
        status: application.job.status,
        maxWorkers: application.job.maxWorkers,
        
        restaurant: {
          id: application.job.restaurant.id,
          name: application.job.restaurant.name,
          description: application.job.restaurant.description,
          logoUrl: application.job.restaurant.logoUrl,
          businessType: application.job.restaurant.businessType,
          cuisineType: application.job.restaurant.cuisineType,
          address: application.job.restaurant.address,
          photos: application.job.restaurant.photos.map(photo => ({
            id: photo.id,
            url: photo.url,
            caption: photo.caption,
            type: photo.type
          }))
        }
      },
      
      // Applicant details
      applicant: {
        id: application.worker.id,
        name: application.worker.user.name,
        email: application.worker.user.email,
        phone: application.worker.user.phone,
        bio: application.worker.bio,
        title: application.worker.title,
        yearsOfExperience: application.worker.yearsOfExperience,
        hourlyRate: application.worker.hourlyRate,
        profilePictureUrl: application.worker.profilePictureUrl,
        resumeUrl: application.worker.resumeUrl,
        contactEmail: application.worker.contactEmail,
        contactPhone: application.worker.contactPhone,
        preferredContactMethod: application.worker.preferredContactMethod,
        address: application.worker.address,
        city: application.worker.city,
        state: application.worker.state,
        zipCode: application.worker.zipCode,
        
        skills: application.worker.workerSkills.map(skill => ({
          id: skill.id,
          name: skill.name,
          level: skill.level,
          yearsExperience: skill.yearsExperience
        })),
        
        certifications: application.worker.certifications.map(cert => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          documentUrl: cert.documentUrl
        })),
        
        documents: application.worker.documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          uploadedAt: doc.uploadDate
        }))
      },
      
      // Communication history
      messages: application.messages.map(message => ({
        id: message.id,
        content: message.content,
        sentAt: message.createdAt,
        sender: message.sender,
        recipient: message.recipient
      })),
      
      // Schedule information
      shiftAssignment: application.shiftAssignment ? {
        id: application.shiftAssignment.id,
        startTime: application.shiftAssignment.startTime,
        endTime: application.shiftAssignment.endTime,
        status: application.shiftAssignment.status,
        notes: application.shiftAssignment.notes
      } : null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = params.id;
    const body = await request.json();
    const { status, responseNote, interviewDate, interviewTime, notes } = body;

    // Verify application exists and belongs to restaurant owner
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          restaurant: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      updateData.respondedAt = new Date();
    }
    
    if (responseNote !== undefined) {
      updateData.responseNote = responseNote;
    }

    const updatedApplication = await prisma.application.update({
      where: {
        id: applicationId
      },
      data: updateData,
      include: {
        job: {
          include: {
            restaurant: true
          }
        },
        worker: {
          include: {
            user: true
          }
        }
      }
    });

    // If scheduling an interview, you might want to create a separate interview record
    // This would require additional schema changes for interview scheduling

    // Trigger notification for status change
    if (status) {
      await NotificationTriggers.onApplicationStatusChanged(
        applicationId,
        status,
        responseNote
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        respondedAt: updatedApplication.respondedAt,
        responseNote: updatedApplication.responseNote,
        jobTitle: updatedApplication.job.title,
        applicantName: updatedApplication.worker.user.name
      },
      message: 'Application updated successfully'
    });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;

    // Verify application exists and user has permission to delete
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        OR: [
          // Restaurant owner can delete applications for their jobs
          {
            job: {
              restaurant: {
                ownerId: session.user.id
              }
            }
          },
          // Worker can delete their own applications (withdraw)
          {
            worker: {
              userId: session.user.id
            }
          }
        ]
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Delete application (this will cascade to related records)
    await prisma.application.delete({
      where: {
        id: applicationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
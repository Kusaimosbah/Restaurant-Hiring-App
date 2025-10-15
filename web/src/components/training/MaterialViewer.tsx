'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  PuzzlePieceIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'INTERACTIVE';
  content: string;
  order: number;
  estimatedTimeMinutes: number;
  module: {
    id: string;
    title: string;
    materials: {
      id: string;
      title: string;
      order: number;
    }[];
  };
  progress: {
    id: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    score: number | null;
    startedAt: string | null;
    completedAt: string | null;
    lastAccessedAt: string | null;
    timeSpentMinutes: number;
  };
  navigation: {
    next: { id: string; title: string; } | null;
    previous: { id: string; title: string; } | null;
  };
}

interface Quiz {
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export default function MaterialViewer({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [material, setMaterial] = useState<TrainingMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  
  useEffect(() => {
    fetchMaterialDetails();
    
    // Start timer for tracking time spent
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Update every minute
    
    return () => {
      clearInterval(timer);
      // Save time spent when component unmounts
      if (material) {
        updateProgress(material.progress.status, timeSpent);
      }
    };
  }, [materialId]);
  
  // Save time spent periodically
  useEffect(() => {
    if (material && timeSpent > 0 && timeSpent % 5 === 0) { // Save every 5 minutes
      updateProgress(material.progress.status, timeSpent);
    }
  }, [timeSpent, material]);
  
  const fetchMaterialDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/training/materials/${materialId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch material details');
      }
      
      const data = await response.json();
      setMaterial(data);
      
      // Initialize quiz answers if it's a quiz
      if (data.type === 'QUIZ') {
        try {
          const quizContent = JSON.parse(data.content) as Quiz;
          setQuizAnswers(new Array(quizContent.questions.length).fill(-1));
          
          // If quiz was already completed and has a score, mark as submitted
          if (data.progress.status === 'COMPLETED' && data.progress.score !== null) {
            setQuizSubmitted(true);
            setQuizScore(data.progress.score);
          }
        } catch (e) {
          console.error('Error parsing quiz content:', e);
        }
      }
      
      // If this is the first view, update to IN_PROGRESS
      if (data.progress.status === 'NOT_STARTED') {
        updateProgress('IN_PROGRESS');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching material details:', error);
      setError('Failed to load training material. Please try again later.');
      setLoading(false);
    }
  };
  
  const updateProgress = async (status: string, minutes?: number) => {
    if (!material) return;
    
    try {
      const updateData: any = { status };
      
      if (minutes !== undefined) {
        updateData.timeSpentMinutes = material.progress.timeSpentMinutes + minutes;
      }
      
      if (status === 'COMPLETED' && material.type === 'QUIZ' && quizScore !== null) {
        updateData.score = quizScore;
      }
      
      const response = await fetch(`/api/training/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        console.error('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };
  
  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return;
    
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };
  
  const handleQuizSubmit = () => {
    if (!material || material.type !== 'QUIZ') return;
    
    try {
      const quizContent = JSON.parse(material.content) as Quiz;
      let correctAnswers = 0;
      
      quizContent.questions.forEach((question, index) => {
        if (quizAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / quizContent.questions.length) * 100);
      setQuizScore(score);
      setQuizSubmitted(true);
      
      // Mark as completed if score is 70% or higher
      if (score >= 70) {
        updateProgress('COMPLETED', timeSpent);
      } else {
        updateProgress('IN_PROGRESS', timeSpent);
      }
    } catch (e) {
      console.error('Error processing quiz:', e);
    }
  };
  
  const handleComplete = () => {
    updateProgress('COMPLETED', timeSpent);
    
    // Update local state
    if (material) {
      setMaterial({
        ...material,
        progress: {
          ...material.progress,
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        }
      });
    }
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'm' : ''}`;
  };
  
  const renderMaterialContent = () => {
    if (!material) return null;
    
    switch (material.type) {
      case 'VIDEO':
        return (
          <div className="aspect-video mb-6">
            <div className="bg-gray-200 h-full w-full flex items-center justify-center rounded-md">
              <VideoCameraIcon className="h-16 w-16 text-gray-400" />
              <p className="ml-2 text-gray-500">Video Player</p>
              <p className="text-sm text-gray-500">(Video URL: {material.content})</p>
            </div>
          </div>
        );
        
      case 'DOCUMENT':
        return (
          <div className="bg-gray-50 border rounded-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium">Document</h3>
            </div>
            <p className="text-sm text-gray-500 mb-2">Document URL: {material.content}</p>
            <div className="flex justify-center mt-4">
              <Button 
                as="a" 
                href={material.content} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open Document
              </Button>
            </div>
          </div>
        );
        
      case 'QUIZ':
        try {
          const quiz = JSON.parse(material.content) as Quiz;
          return (
            <div className="bg-white border rounded-md p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Quiz</h3>
              
              {quizSubmitted && quizScore !== null && (
                <div className={`p-4 mb-6 rounded-md ${
                  quizScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    {quizScore >= 70 ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
                    )}
                    <div>
                      <h4 className="font-medium">
                        {quizScore >= 70 ? 'Quiz Passed!' : 'Quiz Not Passed'}
                      </h4>
                      <p className="text-sm">
                        Your score: {quizScore}% 
                        {quizScore < 70 && ' (70% required to pass)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {quiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="mb-6">
                  <h4 className="font-medium mb-2">
                    {qIndex + 1}. {question.question}
                  </h4>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`p-3 border rounded-md cursor-pointer ${
                          quizAnswers[qIndex] === oIndex 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          quizSubmitted && oIndex === question.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : quizSubmitted && quizAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer
                              ? 'border-red-500 bg-red-50'
                              : ''
                        }`}
                        onClick={() => handleQuizAnswer(qIndex, oIndex)}
                      >
                        <div className="flex items-center">
                          <div className={`h-4 w-4 mr-2 rounded-full border ${
                            quizAnswers[qIndex] === oIndex 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {quizAnswers[qIndex] === oIndex && (
                              <div className="h-2 w-2 m-auto rounded-full bg-white" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {!quizSubmitted && (
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleQuizSubmit}
                    disabled={quizAnswers.some(a => a === -1)}
                  >
                    Submit Quiz
                  </Button>
                </div>
              )}
              
              {quizSubmitted && quizScore !== null && quizScore < 70 && (
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizScore(null);
                      setQuizAnswers(new Array(quiz.questions.length).fill(-1));
                    }}
                  >
                    Retry Quiz
                  </Button>
                </div>
              )}
            </div>
          );
        } catch (e) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                <p>Error loading quiz content. Please contact support.</p>
              </div>
            </div>
          );
        }
        
      case 'INTERACTIVE':
        return (
          <div className="bg-gray-50 border rounded-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-8 w-8 text-orange-500 mr-2" />
              <h3 className="text-lg font-medium">Interactive Exercise</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This is an interactive training exercise. Click the button below to launch it.
            </p>
            <div className="flex justify-center">
              <Button 
                as="a" 
                href={material.content} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Launch Exercise
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-gray-50 border rounded-md p-6 mb-6">
            <p className="text-gray-600">Content not available.</p>
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p>Loading training material...</p>
        </div>
      </div>
    );
  }
  
  if (error || !material) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Material not found'}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/training')}
          >
            Back to Training Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const isCompleted = material.progress.status === 'COMPLETED';
  const isQuiz = material.type === 'QUIZ';
  const canMarkComplete = !isQuiz && !isCompleted;
  
  return (
    <div className="container mx-auto px-4 py-6 bg-white text-black">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/training/modules/${material.module.id}`)}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Module
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
          <Badge variant="outline" className="ml-2 text-gray-700 border-gray-300">
            {material.type === 'VIDEO' && 'Video'}
            {material.type === 'DOCUMENT' && 'Document'}
            {material.type === 'QUIZ' && 'Quiz'}
            {material.type === 'INTERACTIVE' && 'Interactive'}
          </Badge>
        </div>
        <p className="text-gray-700 mt-1">{material.description}</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span>Estimated time: {formatTime(material.estimatedTimeMinutes)}</span>
            </div>
            
            <div>
              {isCompleted ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-blue-500 text-white">In Progress</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {renderMaterialContent()}
      
      <div className="flex justify-between mt-8">
        {material.navigation.previous ? (
          <Button 
            variant="outline"
            onClick={() => router.push(`/training/materials/${material.navigation.previous!.id}`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Previous: {material.navigation.previous.title}
          </Button>
        ) : (
          <div></div>
        )}
        
        <div className="flex space-x-2">
          {canMarkComplete && (
            <Button onClick={handleComplete}>
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Mark as Complete
            </Button>
          )}
          
          {material.navigation.next && (
            <Button 
              onClick={() => router.push(`/training/materials/${material.navigation.next!.id}`)}
            >
              Next: {material.navigation.next.title}
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

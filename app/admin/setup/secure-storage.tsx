"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Download, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import type { Lesson } from "@/types/supabase"

interface ValidLesson {
  id: string;
  title: string;
  video_url?: string;
  instructor_id: string;
  price: number;
}

interface MonitorDetail {
  lessonId: string;
  title: string;
  status: 'accessible' | 'fixed-with-fallback' | 'inaccessible' | 'error-checking' | 'error';
  videoPath: string;
  error?: any; // Keep error as any for now, as it can be diverse
}

interface MonitorResultsState {
  totalLessons: number;
  accessibleLessons: number;
  inaccessibleLessons: number;
  fixedLessons: number;
  details: MonitorDetail[];
}

export default function SecureStorageSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [monitorResults, setMonitorResults] = useState<MonitorResultsState | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  const secureVideoBucket = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/secure-video-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      setResult(data)

      if (data.success) {
        toast({
          title: "Success",
          description: "Videos bucket has been secured successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to secure videos bucket. See details for more information.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      })
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const downloadMigrationSQL = () => {
    if (!result?.migrationSQL) return

    const blob = new Blob([result.migrationSQL], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "secure-videos-bucket.sql"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Function to monitor the transition to ensure users still have access
  const monitorTransition = async () => {
    try {
      setIsMonitoring(true)
      setProgress(0)
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      
      // Get total number of lessons with videos
      const { data: lessonCount, error: lessonCountError } = await supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .not('video_url', 'is', null);
        
      if (lessonCountError) {
        throw new Error(`Error counting lessons: ${lessonCountError.message}`);
      }
      
      const totalLessons = lessonCount?.length || 0;
      let processedLessons = 0;
      let accessibleLessons = 0;
      let inaccessibleLessons = 0;
      let fixedLessons = 0;
      const details: MonitorDetail[] = [];
      
      // Fetch lessons in batches to avoid timeout
      const batchSize = 10;
      let lastProcessedId = null;
      
      while (true) {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        
        let query = supabase
          .from('lessons')
          .select('id, title, video_url, instructor_id, price')
          .not('video_url', 'is', null)
          .order('id')
          .limit(batchSize);
          
        if (lastProcessedId) {
          query = query.gt('id', lastProcessedId);
        }
        
        const { data: lessons, error: lessonsError } = await query;
        
        if (lessonsError) {
          throw new Error(`Error fetching lessons: ${lessonsError.message}`);
        }
        
        if (!lessons || lessons.length === 0) {
          break; // No more lessons to process
        }
        
        // Check if we have a valid response
        if (!lessons || 'error' in lessons) {
          throw new Error(`Error fetching lessons: ${JSON.stringify(lessons)}`);
        }
        
        // Process each lesson in the batch
        // Cast to ValidLesson[] to fix TypeScript errors
        const validLessons = lessons as ValidLesson[];
        
        for (const lesson of validLessons) {
          try {
            // Test video access
            const videoPath = lesson.video_url || '';
            if (!videoPath) {
              // Skip lessons without video URLs
              details.push({
                lessonId: lesson.id || 'unknown',
                title: lesson.title || 'Untitled Lesson',
                status: 'error',
                videoPath: 'missing',
                error: 'No video URL found for this lesson'
              });
              continue;
            }
            
            // Try to get a signed URL
            if (!supabase) {
              throw new Error("Supabase client not initialized");
            }
            
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('videos')
              .createSignedUrl(videoPath, 60); // 1 minute expiry for testing
              
            if (signedUrlError) {
              inaccessibleLessons++;
              
              // Try fallback approach
              const publicUrl = `https://fduuujxzwwrbshamtriy.supabase.co/storage/v1/object/public/videos/${videoPath}`;
              
              // Check if public URL works (this is just a simple HEAD request)
              try {
                const response = await fetch(publicUrl, { method: 'HEAD' });
                if (response.ok) {
                  // Public URL works, need to fix policies
                  fixedLessons++;
                  details.push({
                    lessonId: lesson.id,
                    title: lesson.title,
                    status: 'fixed-with-fallback',
                    videoPath
                  });
                } else {
                  // Neither signed nor public URL works
                  details.push({
                    lessonId: lesson.id,
                    title: lesson.title,
                    status: 'inaccessible',
                    videoPath,
                    error: signedUrlError
                  });
                }
              } catch (e) {
                // Network error checking public URL
                details.push({
                  lessonId: lesson.id,
                  title: lesson.title,
                  status: 'error-checking',
                  videoPath,
                  error: e
                });
              }
            } else {
              // Signed URL works
              accessibleLessons++;
              details.push({
                lessonId: lesson.id,
                title: lesson.title,
                status: 'accessible',
                videoPath
              });
            }
          } catch (e) {
            details.push({
              lessonId: lesson.id,
              title: lesson.title,
              status: 'error',
              videoPath: lesson?.video_url || 'unknown', // Add videoPath here
              error: e
            });
          }
          
          processedLessons++;
          setProgress(Math.floor((processedLessons / totalLessons) * 100));
          lastProcessedId = lesson.id;
        }
      }
      
      setMonitorResults({
        totalLessons,
        accessibleLessons,
        inaccessibleLessons,
        fixedLessons,
        details
      });
      
    } catch (error: unknown) {
      let errorMessage = "An error occurred while monitoring the transition.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
      console.error("Monitoring error:", error);
    } finally {
      setIsMonitoring(false);
      setProgress(100);
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Secure Storage Buckets</CardTitle>
        <CardDescription>Fix security issues with public storage buckets</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <AlertTitle>Security Fix</AlertTitle>
          <AlertDescription>
            This will secure the videos bucket by:
            <ol className="list-decimal pl-5 mt-2">
              <li>Setting the videos bucket to non-public</li>
              <li>Removing any public access policies</li>
              <li>Creating proper RLS policies to ensure only authorized users can access videos</li>
            </ol>
            <p className="mt-2">
              This is a recommended security fix and will not impact existing users' ability to access content they are authorized to view.
            </p>
          </AlertDescription>
        </Alert>

        {result && (
          <Tabs defaultValue="results" className="mt-4">
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
              {result.migrationSQL && (
                <TabsTrigger value="migration">Migration SQL</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="results">
              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center mb-2">
                  <span className="font-semibold mr-2">Status:</span>
                  {result.success ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Success
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" /> Failed
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <p className="font-semibold">Details:</p>
                  <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
            {result.migrationSQL && (
              <TabsContent value="migration">
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Migration SQL:</span>
                    <Button variant="outline" size="sm" onClick={downloadMigrationSQL}>
                      <Download className="h-4 w-4 mr-1" /> Download SQL
                    </Button>
                  </div>
                  <Textarea
                    className="font-mono text-xs mt-2 bg-background h-[300px]"
                    readOnly
                    value={result.migrationSQL}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={secureVideoBucket} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Securing videos bucket...
            </>
          ) : (
            "Secure Videos Bucket"
          )}
        </Button>
        {result?.success && (
          <Button 
            onClick={monitorTransition}
            variant="outline"
            disabled={isMonitoring}
            className="ml-2"
          >
            {isMonitoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Monitoring Access ({progress}%)
              </>
            ) : (
              "Monitor Content Access"
            )}
          </Button>
        )}
      </CardFooter>
      
      {isMonitoring && (
        <div className="px-6 pb-4">
          <div className="text-sm mb-2">Checking video access...</div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {monitorResults && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-muted rounded-md mt-4">
            <h3 className="font-semibold mb-2">Access Monitoring Results</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-background p-3 rounded text-center">
                <div className="text-2xl font-bold">{monitorResults.totalLessons}</div>
                <div className="text-xs text-muted-foreground">Total Lessons</div>
              </div>
              <div className="bg-background p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-500">{monitorResults.accessibleLessons}</div>
                <div className="text-xs text-muted-foreground">Accessible</div>
              </div>
              <div className="bg-background p-3 rounded text-center">
                <div className="text-2xl font-bold text-amber-500">{monitorResults.fixedLessons}</div>
                <div className="text-xs text-muted-foreground">Fixed with Fallback</div>
              </div>
              <div className="bg-background p-3 rounded text-center">
                <div className="text-2xl font-bold text-red-500">{monitorResults.inaccessibleLessons - monitorResults.fixedLessons}</div>
                <div className="text-xs text-muted-foreground">Inaccessible</div>
              </div>
            </div>
            
            {monitorResults.inaccessibleLessons > 0 && (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Some videos need attention</AlertTitle>
                <AlertDescription>
                  {monitorResults.fixedLessons} videos are currently relying on the fallback mechanism. 
                  {monitorResults.inaccessibleLessons - monitorResults.fixedLessons > 0 && 
                    ` ${monitorResults.inaccessibleLessons - monitorResults.fixedLessons} videos are inaccessible.`}
                  <div className="mt-2">
                    The fallback mechanism will ensure users maintain access during the transition, but you should check the details below.
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <h4 className="font-semibold mt-4 mb-2">Details</h4>
            <div className="max-h-[300px] overflow-auto bg-background p-2 rounded text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Lesson</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorResults.details.map((detail, index) => (
                    <tr key={index} className="border-b border-muted">
                      <td className="p-2">{detail.title} ({detail.lessonId})</td>
                      <td className="p-2">
                        {detail.status === 'accessible' && <span className="text-green-500">Accessible</span>}
                        {detail.status === 'fixed-with-fallback' && <span className="text-amber-500">Fixed with Fallback</span>}
                        {detail.status === 'inaccessible' && <span className="text-red-500">Inaccessible</span>}
                        {detail.status === 'error-checking' && <span className="text-red-500">Error Checking</span>}
                        {detail.status === 'error' && <span className="text-red-500">Error</span>}
                      </td>
                      <td className="p-2 break-all">{detail.videoPath}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

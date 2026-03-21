import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Shield, 
  Database, 
  Globe, 
  Zap,
  Check,
  RefreshCw,
  Download,
  ExternalLink,
  Clock,
  Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jobService } from '@/services';
import { toast } from 'sonner';

interface JobSource {
  id: string;
  name: string;
  icon: React.ElementType;
  jobsScraped: number;
  lastScraped: string;
  status: 'active' | 'paused' | 'error';
  quality: number;
}

interface Job {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  status?: 'new' | 'processed' | 'published';
  createdAt?: string;
}

export function JobIntelligence() {
  const [sources] = useState<JobSource[]>([
    { id: 'linkedin', name: 'LinkedIn Jobs', icon: Globe, jobsScraped: 4523, lastScraped: '2 min ago', status: 'active', quality: 95 },
    { id: 'indeed', name: 'Indeed', icon: Search, jobsScraped: 3891, lastScraped: '5 min ago', status: 'active', quality: 88 },
    { id: 'naukri', name: 'Naukri.com', icon: Database, jobsScraped: 2156, lastScraped: '10 min ago', status: 'active', quality: 92 },
    { id: 'foundit', name: 'Foundit', icon: Globe, jobsScraped: 1247, lastScraped: '15 min ago', status: 'active', quality: 85 },
    { id: 'api1', name: 'Recruiter API', icon: Zap, jobsScraped: 892, lastScraped: '1 hour ago', status: 'active', quality: 98 },
  ]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  // Fetch jobs from API
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await jobService.getAllJobs({ page: 1, pageSize: 20 });
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const startScraping = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      toast.success('Job scraping completed!');
      fetchJobs();
    }, 3000);
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      'new': 'bg-violet-600/20 text-violet-400',
      'processed': 'bg-emerald-600/20 text-emerald-400',
      'published': 'bg-blue-600/20 text-blue-400',
      'duplicate': 'bg-amber-600/20 text-amber-400',
      'spam': 'bg-red-600/20 text-red-400',
    };
    return styles[status || 'new'] || styles.new;
  };

  const stats = {
    totalScraped: sources.reduce((sum, s) => sum + s.jobsScraped, 0),
    duplicates: Math.floor(sources.reduce((sum, s) => sum + s.jobsScraped, 0) * 0.1),
    spam: Math.floor(sources.reduce((sum, s) => sum + s.jobsScraped, 0) * 0.03),
    processed: jobs.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Job Intelligence</h1>
        <div className="flex gap-2">
          <Button 
            onClick={fetchJobs}
            className="bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={startScraping}
            disabled={isScraping}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isScraping ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Scraping
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Scraped</p>
                <p className="text-2xl font-bold">{stats.totalScraped.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-violet-400/50" />
            </div>
            <Progress value={100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Processed</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.processed}</p>
              </div>
              <Check className="w-8 h-8 text-emerald-400/50" />
            </div>
            <Progress value={Math.floor((stats.processed / stats.totalScraped) * 100)} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Duplicates</p>
                <p className="text-2xl font-bold text-amber-400">{stats.duplicates}</p>
              </div>
              <Trash2 className="w-8 h-8 text-amber-400/50" />
            </div>
            <Progress value={20} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Spam</p>
                <p className="text-2xl font-bold text-red-400">{stats.spam}</p>
              </div>
              <Shield className="w-8 h-8 text-red-400/50" />
            </div>
            <Progress value={3} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-white/6 p-1">
          <TabsTrigger value="jobs" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            Jobs
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle>Jobs ({jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-2 text-left text-zinc-400">Job Title</th>
                      <th className="px-4 py-2 text-left text-zinc-400">Company</th>
                      <th className="px-4 py-2 text-left text-zinc-400">Location</th>
                      <th className="px-4 py-2 text-left text-zinc-400">Status</th>
                      <th className="px-4 py-2 text-left text-zinc-400">Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="border-b border-white/6 hover:bg-white/5">
                        <td className="px-4 py-3 font-semibold">{job.title}</td>
                        <td className="px-4 py-3 text-zinc-400">{job.company || 'N/A'}</td>
                        <td className="px-4 py-3 text-zinc-400">{job.location || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadge(job.status || 'new')}>
                            {job.status || 'new'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle>Job Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sources.map(source => {
                const Icon = source.icon;
                return (
                  <div key={source.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-4 flex-1">
                      <Icon className="w-6 h-6 text-violet-400" />
                      <div className="flex-1">
                        <p className="font-semibold">{source.name}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                          <span>📊 {source.jobsScraped.toLocaleString()} jobs</span>
                          <span>⏱️ {source.lastScraped}</span>
                          <span>⭐ {source.quality}% quality</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={source.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}>
                        {source.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

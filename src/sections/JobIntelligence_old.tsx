import { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
interface JobSource {
  id: string;
  name: string;
  icon: React.ElementType;
  jobsScraped: number;
  lastScraped: string;
  status: 'active' | 'paused' | 'error';
  quality: number;
}

interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  status: 'new' | 'processed' | 'duplicate' | 'spam';
  scrapedAt: string;
}

export function JobIntelligence() {
  const [sources] = useState<JobSource[]>([
    { id: 'linkedin', name: 'LinkedIn Jobs', icon: Globe, jobsScraped: 4523, lastScraped: '2 min ago', status: 'active', quality: 95 },
    { id: 'indeed', name: 'Indeed', icon: Search, jobsScraped: 3891, lastScraped: '5 min ago', status: 'active', quality: 88 },
    { id: 'naukri', name: 'Naukri.com', icon: Database, jobsScraped: 2156, lastScraped: '10 min ago', status: 'active', quality: 92 },
    { id: 'foundit', name: 'Foundit', icon: Globe, jobsScraped: 1247, lastScraped: '15 min ago', status: 'active', quality: 85 },
    { id: 'api1', name: 'Recruiter API', icon: Zap, jobsScraped: 892, lastScraped: '1 hour ago', status: 'active', quality: 98 },
  ]);

  const [jobs] = useState<ScrapedJob[]>([
    { id: '1', title: 'Senior React Developer', company: 'TCS', location: 'Bangalore', source: 'LinkedIn', status: 'new', scrapedAt: '2 min ago' },
    { id: '2', title: 'Python Full Stack', company: 'Infosys', location: 'Hyderabad', source: 'Indeed', status: 'processed', scrapedAt: '5 min ago' },
    { id: '3', title: 'Java Developer', company: 'Wipro', location: 'Chennai', source: 'Naukri', status: 'duplicate', scrapedAt: '8 min ago' },
    { id: '4', title: 'Data Scientist', company: 'Google', location: 'Mumbai', source: 'LinkedIn', status: 'new', scrapedAt: '10 min ago' },
    { id: '5', title: 'DevOps Engineer', company: 'Amazon', location: 'Pune', source: 'Indeed', status: 'spam', scrapedAt: '12 min ago' },
    { id: '6', title: 'UI/UX Designer', company: 'Microsoft', location: 'Delhi', source: 'Foundit', status: 'processed', scrapedAt: '15 min ago' },
  ]);

  const [isScraping, setIsScraping] = useState(false);
  const [stats] = useState({
    totalScraped: 12709,
    duplicates: 1247,
    spam: 389,
    processed: 11073,
  });

  const startScraping = () => {
    setIsScraping(true);
    setTimeout(() => setIsScraping(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-violet-600/20 text-violet-400',
      processed: 'bg-emerald-600/20 text-emerald-400',
      duplicate: 'bg-amber-600/20 text-amber-400',
      spam: 'bg-red-600/20 text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.new;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Scraped</p>
                <p className="text-2xl font-bold">{stats.totalScraped.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <Progress value={100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Processed</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.processed.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <Progress value={87} className="mt-3 bg-emerald-900" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Duplicates</p>
                <p className="text-2xl font-bold text-amber-400">{stats.duplicates.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Filter className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <Progress value={10} className="mt-3 bg-amber-900" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Spam Blocked</p>
                <p className="text-2xl font-bold text-red-400">{stats.spam.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <Progress value={3} className="mt-3 bg-red-900" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-white/6 p-1">
          <TabsTrigger value="sources" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <Database className="w-4 h-4 mr-2" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <Search className="w-4 h-4 mr-2" />
            Scraped Jobs
          </TabsTrigger>
          <TabsTrigger value="filters" className="data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-400" />
                Job Sources
              </CardTitle>
              <Button 
                onClick={startScraping}
                disabled={isScraping}
                className="gradient-primary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isScraping && 'animate-spin'}`} />
                {isScraping ? 'Scraping...' : 'Run Scraper'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sources.map((source) => {
                  const Icon = source.icon;
                  return (
                    <div 
                      key={source.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {source.lastScraped}
                            </span>
                            <span className="text-xs text-zinc-500">
                              Quality: {source.quality}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{source.jobsScraped.toLocaleString()}</p>
                          <p className="text-xs text-zinc-500">jobs scraped</p>
                        </div>
                        <Badge className={source.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-amber-600/20 text-amber-400'}>
                          {source.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-cyan-400" />
                Recently Scraped Jobs
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/10">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <span className="text-xs font-medium">{job.company[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-zinc-500">{job.company} • {job.location} • {job.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{job.scrapedAt}</span>
                      <Badge className={getStatusBadge(job.status)}>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="mt-4">
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Filter Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Duplicate Detection', desc: 'Remove duplicate job postings across sources', enabled: true },
                { name: 'Spam Filter', desc: 'Filter out suspicious and low-quality postings', enabled: true },
                { name: 'Company Validation', desc: 'Verify company existence and reputation', enabled: true },
                { name: 'Salary Validation', desc: 'Detect and flag unrealistic salary ranges', enabled: false },
                { name: 'Location Filter', desc: 'Filter by specified locations only', enabled: false },
              ].map((filter, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div>
                    <p className="font-medium text-sm">{filter.name}</p>
                    <p className="text-xs text-zinc-500">{filter.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${filter.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${filter.enabled ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Automation Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Automation Status</p>
                <p className="text-sm text-zinc-500">All scraping operations are fully automated</p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 text-emerald-400 text-lg px-4 py-2">
              100% Automated
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

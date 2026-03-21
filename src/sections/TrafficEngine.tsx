import { useState } from 'react';
import { 
  Facebook, 
  Send, 
  Twitter, 
  Instagram, 
  Sparkles, 
  TrendingUp,
  Play,
  Settings,
  Wand2,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';



interface PlatformCardProps {
  name: string;
  icon: React.ElementType;
  connected: boolean;
  posts: number;
  status: 'active' | 'pending' | 'disconnected';
  onToggle: () => void;
}

function PlatformCard({ name, icon: Icon, connected, posts, status, onToggle }: PlatformCardProps) {
  const statusColors = {
    active: 'bg-emerald-500',
    pending: 'bg-amber-500',
    disconnected: 'bg-zinc-500'
  };

  return (
    <Card className="bg-[#1a1a1a] border-white/6 hover:border-violet-500/30 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-violet-600/20' : 'bg-zinc-800'}`}>
              <Icon className={`w-5 h-5 ${connected ? 'text-violet-400' : 'text-zinc-500'}`} />
            </div>
            <div>
              <h4 className="font-medium">{name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'active' && 'animate-pulse'}`} />
                <span className="text-xs text-zinc-400 capitalize">{status}</span>
              </div>
            </div>
          </div>
          <Switch checked={connected} onCheckedChange={onToggle} />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Posts Published</span>
            <span className="font-medium">{posts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Engagement</span>
            <span className="font-medium text-emerald-400">+{Math.floor(Math.random() * 20 + 5)}%</span>
          </div>
        </div>

        {connected && (
          <div className="mt-4 pt-4 border-t border-white/6">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:bg-white/5">
                <Settings className="w-4 h-4 mr-1" />
                Config
              </Button>
              <Button variant="outline" size="sm" className="flex-1 border-white/10 hover:bg-white/5">
                <Play className="w-4 h-4 mr-1" />
                Post Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrafficEngine() {
  const [platforms, setPlatforms] = useState([
    { id: 'facebook', name: 'Facebook Pages', icon: Facebook, connected: true, posts: 1247, status: 'active' as const },
    { id: 'telegram', name: 'Telegram Channels', icon: Send, connected: true, posts: 847, status: 'active' as const },
    { id: 'twitter', name: 'Twitter (X)', icon: Twitter, connected: true, posts: 2156, status: 'active' as const },
    { id: 'instagram', name: 'Instagram', icon: Instagram, connected: false, posts: 0, status: 'disconnected' as const },
  ]);

  const [features, setFeatures] = useState({
    autoPost: true,
    aiCaptions: true,
    hashtagGen: true,
    trendingJobs: true,
    viralCaptions: true,
  });

  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  const togglePlatform = (id: string) => {
    setPlatforms(platforms.map(p => 
      p.id === id 
        ? { ...p, connected: !p.connected, status: !p.connected ? 'active' : 'disconnected' as const }
        : p
    ));
  };

  const generateContent = () => {
    const captions = [
      "🚀 URGENT HIRING! We're looking for talented developers to join our growing team!",
      "💼 Amazing opportunity alert! Top MNCs are hiring freshers and experienced professionals!",
      "🔥 Hot Jobs of the Week! Don't miss these incredible career opportunities!",
      "⚡ Quick Hiring! Immediate joining available for the right candidates!",
    ];
    const hashtags = ['#Hiring', '#Jobs', '#Career', '#ITJobs', '#RemoteWork', '#Freshers', '#Experienced', '#MNC'];
    
    setGeneratedCaption(captions[Math.floor(Math.random() * captions.length)]);
    setGeneratedHashtags(hashtags.sort(() => 0.5 - Math.random()).slice(0, 5));
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalPosts = platforms.reduce((sum, p) => sum + p.posts, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Platforms Connected</p>
                <p className="text-2xl font-bold">{connectedCount}/4</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <Progress value={connectedCount * 25} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Posts</p>
                <p className="text-2xl font-bold">{totalPosts.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-xs text-emerald-400 mt-2">+156 this week</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">AI Captions</p>
                <p className="text-2xl font-bold">4,892</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-emerald-400 mt-2">98% engagement rate</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Automation</p>
                <p className="text-2xl font-bold text-emerald-400">98%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <Badge className="mt-2 bg-emerald-600/20 text-emerald-400">Fully Automated</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          Social Platforms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              name={platform.name}
              icon={platform.icon}
              connected={platform.connected}
              posts={platform.posts}
              status={platform.status}
              onToggle={() => togglePlatform(platform.id)}
            />
          ))}
        </div>
      </div>

      {/* AI Features & Content Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Features */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-400" />
              AI Content Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'autoPost', label: 'Auto Job Posts', desc: 'Automatically post jobs to all connected platforms' },
              { id: 'aiCaptions', label: 'AI Caption Generation', desc: 'Generate engaging captions using AI' },
              { id: 'hashtagGen', label: 'Hashtag Generator', desc: 'Auto-generate relevant hashtags for maximum reach' },
              { id: 'trendingJobs', label: 'Trending Job Detection', desc: 'Identify and prioritize trending job categories' },
              { id: 'viralCaptions', label: 'Viral Caption Generation', desc: 'Create captions optimized for virality' },
            ].map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div>
                  <p className="font-medium text-sm">{feature.label}</p>
                  <p className="text-xs text-zinc-500">{feature.desc}</p>
                </div>
                <Switch 
                  checked={features[feature.id as keyof typeof features]} 
                  onCheckedChange={(checked) => setFeatures({ ...features, [feature.id]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Content Generator */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              AI Content Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Job Title</label>
              <input 
                type="text" 
                placeholder="e.g., Senior React Developer"
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Key Requirements</label>
              <textarea 
                placeholder="Enter key skills and requirements..."
                rows={3}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none resize-none"
              />
            </div>

            <Button 
              onClick={generateContent}
              className="w-full gradient-primary hover:opacity-90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </Button>

            {generatedCaption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-violet-600/10 border border-violet-500/30"
              >
                <p className="text-sm mb-3">{generatedCaption}</p>
                <div className="flex flex-wrap gap-2">
                  {generatedHashtags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-violet-600/20 rounded text-xs text-violet-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { platform: 'Twitter', content: '🔥 Hot Jobs Alert! Multiple openings for Java Developers...', time: '2 min ago', engagement: '234 likes' },
              { platform: 'Facebook', content: '🚀 URGENT HIRING! Looking for Python Developers...', time: '15 min ago', engagement: '89 reactions' },
              { platform: 'Telegram', content: '💼 Amazing opportunity at TCS for freshers...', time: '1 hour ago', engagement: '456 views' },
            ].map((post, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                    {post.platform === 'Twitter' && <Twitter className="w-4 h-4 text-violet-400" />}
                    {post.platform === 'Facebook' && <Facebook className="w-4 h-4 text-violet-400" />}
                    {post.platform === 'Telegram' && <Send className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{post.content}</p>
                    <p className="text-xs text-zinc-500">{post.time} • {post.engagement}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                  Published
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

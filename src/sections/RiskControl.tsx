import { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Clock,
  Settings,
  AlertTriangle,
  Check,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

export function RiskControl() {
  const [mode, setMode] = useState<'safe' | 'aggressive'>('safe');
  const [features, setFeatures] = useState({
    proxyRotation: true,
    rateLimit: true,
    delaySystem: true,
    manualOverride: true,
    captchaSolving: false,
    fingerprintRandomization: true,
  });

  const [stats] = useState({
    requestsToday: 45231,
    blocked: 23,
    successRate: 99.8,
    activeProxies: 47,
  });

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Requests Today</p>
                <p className="text-2xl font-bold">{stats.requestsToday.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.successRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Blocked</p>
                <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Active Proxies</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.activeProxies}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Selection */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Operation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('safe')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                mode === 'safe' 
                  ? 'border-emerald-500/50 bg-emerald-600/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                {mode === 'safe' && <Badge className="bg-emerald-600/20 text-emerald-400">Active</Badge>}
              </div>
              <h3 className="text-lg font-bold mb-2">Safe Mode</h3>
              <p className="text-sm text-zinc-500">Low risk, conservative approach. Longer delays, fewer requests per minute. Best for long-term stability.</p>
              <div className="mt-4 flex gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Delay</p>
                  <p className="text-sm font-medium">3-5 seconds</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Requests/min</p>
                  <p className="text-sm font-medium">10-15</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Risk Level</p>
                  <p className="text-sm font-medium text-emerald-400">Low</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('aggressive')}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                mode === 'aggressive' 
                  ? 'border-amber-500/50 bg-amber-600/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-amber-400" />
                </div>
                {mode === 'aggressive' && <Badge className="bg-amber-600/20 text-amber-400">Active</Badge>}
              </div>
              <h3 className="text-lg font-bold mb-2">Aggressive Mode</h3>
              <p className="text-sm text-zinc-500">High scale, faster processing. Shorter delays, more requests. Higher risk but maximum throughput.</p>
              <div className="mt-4 flex gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Delay</p>
                  <p className="text-sm font-medium">0.5-1 seconds</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Requests/min</p>
                  <p className="text-sm font-medium">50-100</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Risk Level</p>
                  <p className="text-sm font-medium text-amber-400">High</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Protection Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protection Features */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Protection Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'proxyRotation', label: 'Proxy Rotation', desc: 'Rotate IP addresses automatically', icon: Globe },
              { key: 'rateLimit', label: 'Rate Limiting', desc: 'Control request frequency', icon: Clock },
              { key: 'delaySystem', label: 'Delay System', desc: 'Add random delays between requests', icon: Clock },
              { key: 'manualOverride', label: 'Manual Override', desc: 'Allow manual intervention', icon: Settings },
              { key: 'captchaSolving', label: 'Captcha Solving', desc: 'Auto-solve captcha challenges', icon: Shield },
              { key: 'fingerprintRandomization', label: 'Fingerprint Randomization', desc: 'Randomize browser fingerprints', icon: Globe },
            ].map((feature) => {
              const Icon = feature.icon;
              const isEnabled = features[feature.key as keyof typeof features];
              return (
                <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-cyan-600/20' : 'bg-zinc-800'}`}>
                      <Icon className={`w-5 h-5 ${isEnabled ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.label}</p>
                      <p className="text-xs text-zinc-500">{feature.desc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isEnabled} 
                    onCheckedChange={() => toggleFeature(feature.key as keyof typeof features)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Proxy Status */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              Proxy Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Active Proxies</span>
                  <span className="font-bold text-emerald-400">47/50</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-black/30">
                  <p className="text-xs text-zinc-500">US Proxies</p>
                  <p className="text-lg font-bold">18</p>
                </div>
                <div className="p-3 rounded-lg bg-black/30">
                  <p className="text-xs text-zinc-500">EU Proxies</p>
                  <p className="text-lg font-bold">15</p>
                </div>
                <div className="p-3 rounded-lg bg-black/30">
                  <p className="text-xs text-zinc-500">Asia Proxies</p>
                  <p className="text-lg font-bold">12</p>
                </div>
                <div className="p-3 rounded-lg bg-black/30">
                  <p className="text-xs text-zinc-500">India Proxies</p>
                  <p className="text-lg font-bold">2</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-600/10 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400">All systems operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { message: 'Rate limit detected on Indeed', time: '5 min ago', severity: 'warning' },
              { message: 'Proxy rotated successfully', time: '15 min ago', severity: 'info' },
              { message: 'Captcha solved automatically', time: '1 hour ago', severity: 'success' },
              { message: 'Connection timeout on Naukri', time: '2 hours ago', severity: 'error' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/30">
                <div className={`w-2 h-2 rounded-full ${
                  alert.severity === 'error' ? 'bg-red-500' : 
                  alert.severity === 'warning' ? 'bg-amber-500' : 
                  alert.severity === 'success' ? 'bg-emerald-500' : 'bg-cyan-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-zinc-500">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

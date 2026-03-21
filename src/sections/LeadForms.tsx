import { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Eye, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Layout, 
  CheckSquare, 
  Type, 
  FileText,
  BarChart2,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function LeadForms() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const forms = [
    { id: '1', name: 'Software Engineer Application', fields: 8, conversions: 124, status: 'Active' },
    { id: '2', name: 'Marketing Internship 2026', fields: 5, conversions: 89, status: 'Active' },
    { id: '3', name: 'Sales Executive Quick Form', fields: 4, conversions: 45, status: 'Draft' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Capture Forms</h2>
          <p className="text-zinc-400">Build and deploy high-conversion forms</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create New Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {forms.map((form) => (
            <Card key={form.id} className="bg-[#1a1a1a] border-white/6 hover:border-violet-500/50 transition-colors group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{form.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {form.fields} Fields
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" />
                        {form.conversions} Conversions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${form.status === 'Active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-zinc-600/20 text-zinc-400'}`}>
                    {form.status}
                  </Badge>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="bg-violet-600/5 border-violet-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-400" />
                Quick Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-zinc-900 border border-white/6 rounded-lg cursor-move hover:border-violet-500/50 transition-colors flex items-center gap-3">
                <Type className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-white">Short Answer</span>
              </div>
              <div className="p-3 bg-zinc-900 border border-white/6 rounded-lg cursor-move hover:border-violet-500/50 transition-colors flex items-center gap-3">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-white">Paragraph</span>
              </div>
              <div className="p-3 bg-zinc-900 border border-white/6 rounded-lg cursor-move hover:border-violet-500/50 transition-colors flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-zinc-500" />
                <span className="text-xs text-white">Checkboxes</span>
              </div>
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg cursor-move hover:border-blue-500/50 transition-colors flex items-center gap-3">
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">File Upload (Resume)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Full Name</label>
                  <Input placeholder="John Doe" className="bg-zinc-900 border-white/10 h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Email Address</label>
                  <Input placeholder="john@example.com" className="bg-zinc-900 border-white/10 h-8 text-xs" />
                </div>
                <Button className="w-full gradient-primary h-8 text-xs">Apply Now</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

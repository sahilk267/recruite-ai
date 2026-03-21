import { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { outreachService } from '@/services';
import type { EmailTemplate } from '@/types';
import { toast } from 'sonner';

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Mocking for now as backend endpoint is newly defined
      // const response = await outreachService.getTemplates();
      // if (response.success) setTemplates(response.data);
      
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Classic Intro',
          subject: 'Talent Partnership with {{company_name}}',
          body: 'Hello {{recruiter_name}},\n\nI noticed you are hiring for roles at {{company_name}}...',
          variables: ['recruiter_name', 'company_name'],
          category: 'intro',
          is_active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'First Follow-up',
          subject: 'Re: Talent Partnership',
          body: 'Hi {{recruiter_name}},\n\nJust following up on my previous email...',
          variables: ['recruiter_name'],
          category: 'follow-up',
          is_active: true,
          createdAt: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Templates</h2>
          <p className="text-zinc-400">Manage your automated outreach sequences</p>
        </div>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card className="bg-[#1a1a1a] border-white/6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search templates..." 
                className="pl-10 bg-black/20 border-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className="p-4 rounded-xl bg-black/30 border border-white/6 hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase py-0">{template.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300 line-clamp-1 font-medium italic">
                    Subject: {template.subject}
                  </p>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {template.body}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between text-[10px]">
                  <div className="flex gap-1">
                    {template.variables.map(v => (
                      <span key={v} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                  <span className="text-zinc-600">
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 flex gap-3 text-sm">
        <Info className="w-5 h-5 text-violet-400 shrink-0" />
        <p className="text-zinc-300">
          Templates support dynamic variables. Use <code className="text-violet-400">{"{{variable_name}}"}</code> to insert recruiter or company data automatically.
        </p>
      </div>
    </div>
  );
}

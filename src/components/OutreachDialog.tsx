import { useState } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  MessageCircle, 
  Clock,
  ChevronDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Recruiter, EmailTemplate } from '@/types';
import { toast } from 'sonner';

interface OutreachDialogProps {
  recruiter: Recruiter | null;
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function OutreachDialog({ recruiter, isOpen, onClose, onSent }: OutreachDialogProps) {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  if (!recruiter) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      // Mock sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${channel === 'email' ? 'Email' : 'WhatsApp'} sent to ${recruiter.recruiter_name}`);
      onSent();
      onClose();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-400" />
            Outreach to {recruiter.recruiter_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button 
              variant={channel === 'email' ? 'secondary' : 'ghost'} 
              className={channel === 'email' ? 'bg-violet-600/20 text-violet-400' : 'text-zinc-500'}
              onClick={() => setChannel('email')}
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button 
              variant={channel === 'whatsapp' ? 'secondary' : 'ghost'} 
              className={channel === 'whatsapp' ? 'bg-emerald-600/20 text-emerald-400' : 'text-zinc-500'}
              onClick={() => setChannel('whatsapp')}
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-medium">Select Template</label>
            <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Chose a template..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="intro">Classic Intro</SelectItem>
                <SelectItem value="follow-up">First Follow-up</SelectItem>
                <SelectItem value="custom">Custom (Empty)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-medium">Message Body</label>
            <Textarea 
              placeholder="Draft your message..."
              className="min-h-[200px] bg-black/20 border-white/10 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <Clock className="w-3 h-3" />
            Scheduled for immediate delivery
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button 
            className="gradient-primary" 
            onClick={handleSend}
            disabled={!content || sending}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef } from 'react';
import { 
  Users, 
  Upload, 
  FileText, 
  Check, 
  Phone,
  Mail,
  User,
  Briefcase,
  MapPin,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FormField {
  id: string;
  label: string;
  type: string;
  icon: React.ElementType;
  required: boolean;
  placeholder: string;
}

export function LeadCapture() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    location: '',
    skills: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formFields: FormField[] = [
    { id: 'name', label: 'Full Name', type: 'text', icon: User, required: true, placeholder: 'John Doe' },
    { id: 'email', label: 'Email Address', type: 'email', icon: Mail, required: true, placeholder: 'john@example.com' },
    { id: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, required: true, placeholder: '+91 98765 43210' },
    { id: 'experience', label: 'Experience (Years)', type: 'number', icon: Briefcase, required: true, placeholder: '3' },
    { id: 'location', label: 'Location', type: 'text', icon: MapPin, required: false, placeholder: 'Bangalore' },
    { id: 'skills', label: 'Skills (comma separated)', type: 'text', icon: Sparkles, required: false, placeholder: 'React, Node.js, Python' },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('word'))) {
      setUploadedFile(file);
      setTimeout(() => {
        setExtractedSkills(['React', 'JavaScript', 'TypeScript', 'Node.js']);
      }, 1500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setTimeout(() => {
        setExtractedSkills(['React', 'JavaScript', 'TypeScript', 'Node.js']);
      }, 1500);
    }
  };

  const sendOTP = () => {
    if (formData.phone) {
      setOtpSent(true);
    }
  };

  const verifyOTP = () => {
    if (otp.join('') === '123456') {
      setOtpVerified(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const conversionBoosters = [
    { name: 'Urgency Badges', desc: 'Show "Limited openings" indicators', enabled: true },
    { name: 'Hot Jobs Section', desc: 'Display trending job opportunities', enabled: true },
    { name: 'AI Job Recommendations', desc: 'Personalized job suggestions', enabled: true },
    { name: 'Progress Indicator', desc: 'Show form completion progress', enabled: true },
    { name: 'Smart Validation', desc: 'Real-time field validation', enabled: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Leads</p>
                <p className="text-2xl font-bold">8,432</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-emerald-400">34.2%</p>
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
                <p className="text-zinc-400 text-sm">Resumes Uploaded</p>
                <p className="text-2xl font-bold">5,678</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-white/6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Verified Leads</p>
                <p className="text-2xl font-bold text-amber-400">7,891</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Form Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Builder */}
        <Card className="bg-[#1a1a1a] border-white/6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-400" />
              Smart Lead Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm text-zinc-400 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.id as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-violet-500/50 outline-none"
                    />
                  </div>
                </div>
              );
            })}

            {/* Resume Upload */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Resume Upload</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-violet-500 bg-violet-600/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">{uploadedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
                    <p className="text-sm text-zinc-400">Drag & drop or click to upload</p>
                    <p className="text-xs text-zinc-500 mt-1">PDF, DOC up to 5MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Extracted Skills */}
            {extractedSkills.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-600/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Extracted Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, i) => (
                    <Badge key={i} className="bg-emerald-600/20 text-emerald-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* OTP Verification */}
            <div className="space-y-3 pt-4 border-t border-white/6">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">Phone Verification</label>
                {otpVerified ? (
                  <Badge className="bg-emerald-600/20 text-emerald-400">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-amber-600/20 text-amber-400">Pending</Badge>
                )}
              </div>
              
              {!otpSent ? (
                <Button 
                  onClick={sendOTP}
                  disabled={!formData.phone}
                  variant="outline"
                  className="w-full border-white/10"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Send OTP
                </Button>
              ) : !otpVerified ? (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-10 h-12 text-center bg-black/50 border border-white/10 rounded-lg text-lg focus:border-violet-500/50 outline-none"
                      />
                    ))}
                  </div>
                  <Button onClick={verifyOTP} className="w-full gradient-primary">
                    Verify OTP
                  </Button>
                  <p className="text-xs text-center text-zinc-500">Enter 123456 to verify</p>
                </div>
              ) : null}
            </div>

            <Button className="w-full gradient-primary hover:opacity-90 py-3">
              Submit Lead
            </Button>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Conversion Boosters */}
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Conversion Boosters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversionBoosters.map((booster, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div>
                    <p className="font-medium text-sm">{booster.name}</p>
                    <p className="text-xs text-zinc-500">{booster.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${booster.enabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${booster.enabled ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hot Jobs Preview */}
          <Card className="bg-[#1a1a1a] border-white/6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                Hot Jobs Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Senior React Developer', company: 'Google', salary: '₹25-40 LPA', urgency: 'high' },
                { title: 'Python Data Scientist', company: 'Amazon', salary: '₹20-35 LPA', urgency: 'medium' },
                { title: 'DevOps Engineer', company: 'Microsoft', salary: '₹18-30 LPA', urgency: 'high' },
              ].map((job, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-zinc-500">{job.company} • {job.salary}</p>
                    </div>
                    <Badge className={job.urgency === 'high' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}>
                      {job.urgency === 'high' ? 'Urgent' : 'Hot'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Automation Status */}
      <Card className="bg-[#1a1a1a] border-white/6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Lead Capture Automation</p>
                <p className="text-sm text-zinc-500">Forms, uploads, and verification fully automated</p>
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

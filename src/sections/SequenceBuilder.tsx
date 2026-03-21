import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowDown, 
  MessageSquare, 
  Mail, 
  Clock,
  ChevronRight,
  Settings,
  Sparkles,
  Save
} from 'lucide-react';

interface Step {
  id: string;
  delayHours: number;
  channel: 'email' | 'whatsapp' | 'sms';
  templateId: string;
  templateName: string;
}

const SequenceBuilder: React.FC = () => {
  const [name, setName] = useState('New Sequence');
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', delayHours: 0, channel: 'email', templateId: 'welcome', templateName: 'Initial Welcome' }
  ]);

  const addStep = () => {
    const newStep: Step = {
      id: Math.random().toString(36).substr(2, 9),
      delayHours: 24,
      channel: 'whatsapp',
      templateId: '',
      templateName: 'Select Template'
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex border-b border-gray-200 pb-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Plus size={24} className="rotate-45" />
          </button>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 transition-colors">
            <Settings size={18} />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Save size={18} />
            Save Sequence
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div className="flex justify-center flex-col items-center gap-1">
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                  <Clock size={12} />
                  Wait {steps[index].delayHours} hours
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
              </div>
            )}
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group">
              <button 
                onClick={() => removeStep(step.id)}
                className="absolute -right-2 -top-2 p-1.5 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-100 shadow-sm"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex items-center gap-6">
                <div className="flex-none w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <select 
                        value={step.channel}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[index].channel = e.target.value as any;
                          setSteps(newSteps);
                        }}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                      </select>
                      
                      <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                        {step.templateName}
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      <Sparkles size={14} className="text-indigo-400" />
                      <span className="text-xs font-medium uppercase tracking-wider italic">AI Variation Enabled</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 border border-dashed border-gray-200">
                    <p>Sample Content: Hi {"{name}"}, just checking in on your experience with {"{company}"}...</p>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}

        <button 
          onClick={addStep}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} />
          Add Follow-up Step
        </button>
      </div>
    </div>
  );
};

export default SequenceBuilder;

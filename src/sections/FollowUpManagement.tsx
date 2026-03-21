import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  type: 'recruiter' | 'candidate' | 'payment';
  steps: number;
  active: number;
  convRate: string;
}

const mockSequences: Sequence[] = [
  { id: '1', name: 'New Lead Welcome', type: 'candidate', steps: 3, active: 145, convRate: '24%' },
  { id: '2', name: 'Recruiter Outreach v2', type: 'recruiter', steps: 5, active: 89, convRate: '12%' },
  { id: '3', name: 'Payment Reminder', type: 'payment', steps: 2, active: 12, convRate: '45%' },
];

const FollowUpManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sequences' | 'active'>('sequences');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up Engine</h1>
          <p className="text-gray-500">Automate your re-engagement flows</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={20} />
          Create Sequence
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('sequences')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'sequences' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Sequences
        </button>
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'active' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active Follow-ups
        </button>
      </div>

      {activeTab === 'sequences' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSequences.map((seq) => (
            <div key={seq.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${
                  seq.type === 'recruiter' ? 'bg-blue-100 text-blue-600' : 
                  seq.type === 'candidate' ? 'bg-purple-100 text-purple-600' : 
                  'bg-orange-100 text-orange-600'
                }`}>
                  {seq.type === 'recruiter' ? <Mail size={20} /> : <MessageSquare size={20} />}
                </div>
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  {seq.convRate} Conv.
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{seq.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{seq.steps} steps • {seq.active} currently active</p>
              
              <div className="flex gap-2">
                <button className="flex-1 flex justify-center items-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium">
                  Edit Steps
                </button>
                <button className="p-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100">
                  <Play size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search leads or recruiters..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors">
              <Filter size={18} />
              Filters
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Target</th>
                <th className="px-6 py-3 font-semibold">Sequence</th>
                <th className="px-6 py-3 font-semibold">Current Step</th>
                <th className="px-6 py-3 font-semibold">Next Scheduled</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { name: 'John Doe', seq: 'New Lead Welcome', step: '2/3', next: 'Today, 2:00 PM', status: 'pending' },
                { name: 'Tech Corp Recruiting', seq: 'Recruiter Outreach', step: '1/5', next: 'Tomorrow, 9:00 AM', status: 'pending' },
                { name: 'Alice Smith', seq: 'New Lead Welcome', step: '3/3', next: 'Mar 24, 11:00 AM', status: 'paused' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.seq}</td>
                  <td className="px-6 py-4 text-gray-600">{item.step}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.next}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.status === 'pending' ? <Clock size={12} /> : <Pause size={12} />}
                      {item.status === 'pending' ? 'Scheduled' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <Pause size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FollowUpManagement;

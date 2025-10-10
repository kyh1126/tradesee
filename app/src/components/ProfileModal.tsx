import React from 'react';

interface ProfileModalProps {
  onClose: () => void;
}

// Mock data for recent contracts
const recentContracts = [
  {
    route: 'South Korea - China',
    amount: 'About 2K USD',
    status: 'In transit',
    statusColor: 'bg-blue-500'
  },
  {
    route: 'South Korea - China',
    amount: 'About 2K USD',
    status: 'In transit',
    statusColor: 'bg-blue-500'
  },
  {
    route: 'South Korea - USA',
    amount: 'About 15K USD',
    status: 'Complete',
    statusColor: 'bg-green-500'
  },
  {
    route: 'South Korea - China',
    amount: 'About 07K USD',
    status: 'Complete',
    statusColor: 'bg-green-500'
  }
];

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-400/20 backdrop-blur-md rounded-2xl p-8 w-full max-w-4xl border border-blue-300/20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Profile Information */}
          <div className="space-y-6">
            <div>
              <p className="text-white/80 text-sm mb-1">Company</p>
              <p className="text-white text-xl font-bold">ATA Factory</p>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-1">Trades Completed</p>
              <p className="text-white text-xl font-bold">24</p>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-1">Trust Score</p>
              <div className="flex items-center space-x-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">92%</span>
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-1">Location</p>
              <p className="text-white text-xl font-bold">Seoul, KR</p>
            </div>
            <div>
              <p className="text-white/80 text-sm mb-1">Total Deal Amount</p>
              <p className="text-white text-xl font-bold">4832 USD</p>
            </div>
          </div>

          {/* Right Column - Chart and Recent Contracts */}
          <div className="space-y-6">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Recent Contract</h3>
              
              {/* Donut Chart */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                    />
                    {/* South Korea segment (72%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * 0.72} ${2 * Math.PI * 40}`}
                      strokeDashoffset="0"
                    />
                    {/* China segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * 0.2} ${2 * Math.PI * 40}`}
                      strokeDashoffset={`-${2 * Math.PI * 40 * 0.72}`}
                    />
                    {/* USA segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * 0.08} ${2 * Math.PI * 40}`}
                      strokeDashoffset={`-${2 * Math.PI * 40 * 0.92}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-lg font-bold">72%</span>
                    <span className="text-white/80 text-xs">South Korea</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-white text-sm">South Korea</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-white text-sm">China</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-white text-sm">USA</span>
                  </div>
                </div>
              </div>

              {/* Recent Contracts List */}
              <div className="space-y-3">
                {recentContracts.map((contract, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white text-sm">{contract.route}</p>
                      <p className="text-white/60 text-xs">{contract.amount}</p>
                    </div>
                    <span className={`${contract.statusColor} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                      {contract.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

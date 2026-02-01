import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Scale } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 pt-20">
      <div className="text-center max-w-4xl px-6">
        <h1 className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 animate-fadeIn">
          Secure Land Registry on Blockchain
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Experience the future of property management with immutable records,
          transparent ownership, and automated dispute resolution.
        </p>

        <div className="flex gap-6 justify-center mb-16 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <Link to="/dashboard" className="btn-interactive px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-2xl relative z-10">
            Manage My Land
          </Link>
          <a href="#features" className="btn-interactive px-8 py-4 bg-white text-blue-600 border-2 border-blue-100 rounded-full font-bold text-lg hover:border-blue-300 hover:bg-blue-50 relative z-10">
            Learn More
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left mt-10 w-full stagger-children" id="features">
          <FeatureCard
            icon={<Building2 size={40} className="text-blue-500" />}
            title="Asset Tokenization"
            desc="Register land as digital assets with cryptographic proof of ownership."
          />
          <FeatureCard
            icon={<Search size={40} className="text-indigo-500" />}
            title="Instant Verification"
            desc="Verify ownership and history instantly without intermediaries."
          />
          <FeatureCard
            icon={<Scale size={40} className="text-purple-500" />}
            title="Dispute Resolution"
            desc="Transparent mechanism for raising and resolving disputes on-chain."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 card-hover cursor-pointer">
    <div className="mb-4 animate-float">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

export default Home;

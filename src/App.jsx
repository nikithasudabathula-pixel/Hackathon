import { Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import DebugPanel from './components/DebugPanel';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import LandDetails from './pages/LandDetails';
import OfficerPanel from './pages/OfficerPanel';
import AddOfficer from './pages/AddOfficer';
import Deploy from './pages/Deploy';
import TransferOwnership from './pages/TransferOwnership';
import RaiseDispute from './pages/RaiseDispute';

const App = () => {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<TransferOwnership />} />
          <Route path="/dispute" element={<RaiseDispute />} />
          <Route path="/officer" element={<OfficerPanel />} />
          <Route path="/add-officer" element={<AddOfficer />} />
          <Route path="/deploy" element={<Deploy />} />
          <Route path="/land/:id" element={<LandDetails />} />
        </Routes>
        <DebugPanel />
      </div>
    </Web3Provider>
  );
};

export default App;

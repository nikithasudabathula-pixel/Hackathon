import React, { useState, useContext } from 'react';
import { LandRegistryContext } from '../context/LandRegistryContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { PlusCircle, Search, Map, UserCheck } from 'lucide-react';

import { contractABI, contractAddress } from '../utils/contract';

const Dashboard = () => {
    const { getContract, currentAccount, connectWallet } = useContext(LandRegistryContext);
    const navigate = useNavigate();

    // Registration State
    const [formData, setFormData] = useState({
        landId: '',
        documentHash: '',
        datahavenId: '',
        ownerAddress: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchId, setSearchId] = useState('');
    const [contractOwner, setContractOwner] = useState('');

    React.useEffect(() => {
        const fetchOwner = async () => {
            try {
                // Use a read-only provider if available, does not require wallet connection for read operations
                if (window.ethereum) {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const contract = new ethers.Contract(contractAddress, contractABI, provider);
                    const owner = await contract.owner();
                    setContractOwner(owner);
                }
            } catch (err) {
                console.error("Error fetching owner:", err);
            }
        };
        fetchOwner();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            if (!currentAccount) return alert("Please connect wallet");
            const contract = await getContract();
            if (!contract) return;

            setIsLoading(true);
            const { landId, documentHash, datahavenId, ownerAddress } = formData;

            // Ensure bytes32 format for hash
            let formattedHash = documentHash;
            if (!documentHash.startsWith('0x')) {
                formattedHash = ethers.id(documentHash); // Keccak256 hash of string
            }

            const tx = await contract.registerLand(
                landId,
                ownerAddress || currentAccount,
                formattedHash,
                datahavenId
            );
            await tx.wait();
            alert("Land Registered Successfully!");
            setFormData({ landId: '', documentHash: '', datahavenId: '', ownerAddress: '' });
        } catch (error) {
            console.error(error);
            alert("Registration failed: " + (error.reason || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchId) {
            navigate(`/land/${searchId}`);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 bg-gray-50 flex flex-col items-center">
            {/* Owner Address Section - Always Visible */}
            <div className="w-full max-w-5xl mb-8">
                {contractOwner && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <UserCheck className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-semibold">Contract Owner</p>
                                <p className="font-mono text-gray-800 break-all">{contractOwner}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">VERIFIED</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Wallet Connection Check for Main Content */}
            {!currentAccount ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Please Connect Your Wallet</h2>
                    <p className="text-gray-500 mb-6 text-center max-w-md">Connect your MetaMask wallet to access the land registry features, register assets, and verify ownership.</p>
                    <button onClick={connectWallet} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:bg-blue-700">
                        Connect Wallet
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">

                    {/* Register Land Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <PlusCircle className="text-blue-600" size={28} />
                            <h2 className="text-2xl font-bold text-gray-800">Register New Land</h2>
                        </div>

                        <form onSubmit={handleRegister} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Land ID (Numeric)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 101"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.landId}
                                    onChange={(e) => setFormData({ ...formData, landId: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Owner Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.ownerAddress}
                                    onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Document Hash / Content</label>
                                <input
                                    type="text"
                                    placeholder="Verification Hash or String"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.documentHash}
                                    onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Data Haven ID</label>
                                <input
                                    type="text"
                                    placeholder="IPFS CID or ID"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.datahavenId}
                                    onChange={(e) => setFormData({ ...formData, datahavenId: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : 'Register Land'}
                            </button>
                        </form>
                    </div>

                    {/* Search Land Section */}
                    <div className="flex flex-col gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Search className="text-indigo-600" size={28} />
                                <h2 className="text-2xl font-bold text-gray-800">Search Land</h2>
                            </div>
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Enter Land ID"
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    required
                                />
                                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700">
                                    <Search />
                                </button>
                            </form>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                            <Map size={48} className="text-blue-400 mb-4" />
                            <h3 className="text-xl font-bold text-blue-800 mb-2">Explore the Registry</h3>
                            <p className="text-blue-600">
                                Use the search tool to verify ownership, view details, or check dispute status of any registered land asset.
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Dashboard;

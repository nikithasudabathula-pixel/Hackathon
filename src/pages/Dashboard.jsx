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
        ownerAddress: '',
        ownerDetails: '',
        documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        datahavenId: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

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

    const uploadToPinata = async () => {
        if (!selectedFile) {
            alert("Please select a file first");
            return;
        }

        try {
            setUploading(true);

            // Calculate File Hash
            const buffer = await selectedFile.arrayBuffer();
            const hash = ethers.keccak256(new Uint8Array(buffer));

            const data = new FormData();
            data.append('file', selectedFile);

            // REPLACE WITH YOUR PINATA API KEYS
            const pinataApiKey = 'da44c26ff882010951cc';
            const pinataSecretApiKey = '0284b74fe502be4509440a00ebaeef976946b2246b41959c18c23c0bbe0e0476';

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey,
                },
                body: data
            });

            if (!response.ok) {
                throw new Error("Failed to upload to Pinata");
            }

            const result = await response.json();
            const cid = "0x" + result.IpfsHash;

            setFormData(prev => ({
                ...prev,
                datahavenId: cid,
                documentHash: hash
            }));

            alert(`Document uploaded! CID: ${cid}`);

        } catch (error) {
            console.error("Upload Error:", error);
            alert("Error uploading document: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            if (!currentAccount) return alert("Please connect wallet");
            const contract = await getContract();
            if (!contract) return;

            setIsLoading(true);
            const { landId, documentHash, datahavenId, ownerAddress } = formData;

            // Validate owner address if provided
            if (ownerAddress && !ethers.isAddress(ownerAddress)) {
                alert("Invalid owner address format. Please enter a valid Ethereum address (0x...) or leave empty to use your wallet address.");
                setIsLoading(false);
                return;
            }



            // Check if land already exists
            try {
                const existingLand = await contract.getLand(landId);
                // If owner is not zero address, land already exists
                if (existingLand[0] !== '0x0000000000000000000000000000000000000000') {
                    alert(`Land ID ${landId} is already registered to ${existingLand[0]}`);
                    setIsLoading(false);
                    return;
                }
            } catch (checkError) {
                // If getLand reverts, the land doesn't exist yet, which is what we want
                console.log("Land doesn't exist yet - proceeding with registration");
            }

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
            setFormData({
                landId: '',
                ownerAddress: '',
                ownerDetails: '',
                documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                datahavenId: ''
            });
            setSelectedFile(null);
        } catch (error) {
            console.error(error);
            let errorMessage = "Registration failed: ";
            if (error.message.includes("missing revert data") || error.message.includes("execution reverted")) {
                errorMessage += "You don't have permission to register land. Only the contract owner or authorized officers can register new land parcels. Please contact an administrator.";
            } else {
                errorMessage += (error.reason || error.message);
            }
            alert(errorMessage);
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
                                    placeholder="0x... (Leave empty to use your wallet)"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.ownerAddress}
                                    onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Location/Details (Optional - not stored on chain)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., New York, USA (for your reference only)"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.ownerDetails}
                                    onChange={(e) => setFormData({ ...formData, ownerDetails: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Note: This field is for display only and is not saved to the blockchain.</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Document (PNG Upload)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/png"
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                    <button
                                        type="button"
                                        onClick={uploadToPinata}
                                        disabled={uploading || !selectedFile}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {uploading ? '...' : 'Upload'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">CID (Auto-filled)</label>
                                <input
                                    type="text"
                                    placeholder="IPFS CID"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100"
                                    value={formData.datahavenId}
                                    onChange={(e) => setFormData({ ...formData, datahavenId: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Document Hash (Auto-filled)</label>
                                <input
                                    type="text"
                                    placeholder="SHA-256 / Keccak-256 Hash"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100"
                                    value={formData.documentHash}
                                    onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
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

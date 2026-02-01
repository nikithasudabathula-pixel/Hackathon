import React, { useState, useContext } from 'react';
import { LandRegistryContext } from '../context/LandRegistryContext';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { PlusCircle, Search, Map } from 'lucide-react';

const Dashboard = () => {
    const { getContract, currentAccount, connectWallet } = useContext(LandRegistryContext);
    const navigate = useNavigate();

    // Registration State
    const [formData, setFormData] = useState({
        landId: '',
        ownerDetails: '',
        documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        datahavenId: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Search State
    const [searchId, setSearchId] = useState('');

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
            const { landId, documentHash, datahavenId } = formData;

            // Ensure bytes32 format for hash
            let formattedHash = documentHash;
            if (!documentHash.startsWith('0x')) {
                formattedHash = ethers.id(documentHash); // Keccak256 hash of string
            }

            const tx = await contract.registerLand(
                landId,
                currentAccount,
                formattedHash,
                datahavenId
            );
            await tx.wait();
            alert("Land Registered Successfully!");
            setFormData({ landId: '', ownerDetails: '', documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000', datahavenId: '' });
            setSelectedFile(null);
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

    if (!currentAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <h2 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h2>
                <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">
                    Connect Wallet
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 px-4 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">

                {/* Register Land Form */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <PlusCircle className="text-blue-600" size={28} />
                        <h2 className="text-2xl font-bold text-gray-800">Register New Land</h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Land ID (Numeric)</label>
                            <input
                                type="number"
                                placeholder="e.g. 101"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.landId}
                                onChange={(e) => setFormData({ ...formData, landId: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Owner Details</label>
                            <input
                                type="text"
                                placeholder="Name, Address, etc."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.ownerDetails}
                                onChange={(e) => setFormData({ ...formData, ownerDetails: e.target.value })}
                            />
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
                            />
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Register Land'}
                        </button>
                    </div>
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
        </div>
    );
};

export default Dashboard;

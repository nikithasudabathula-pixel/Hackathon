import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { PlusCircle, Search, Map } from 'lucide-react';

const Dashboard = () => {
    const { getContract, account, connectWallet } = useWeb3();
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
            const cid = result.IpfsHash; // IPFS CID without "0x" prefix

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
            if (!account) return alert("Please connect wallet");
            const contract = await getContract();
            if (!contract) return;

            setIsLoading(true);
            const { landId, documentHash, datahavenId } = formData;

            // Ensure bytes32 format for hash
            let formattedHash = documentHash;
            if (!documentHash.startsWith('0x')) {
                formattedHash = ethers.id(documentHash); // Keccak256 hash of string
            }

            // Detailed logging
            console.log("=== REGISTRATION DEBUG ===");
            console.log("Land ID:", landId, "Type:", typeof landId);
            console.log("Owner Address:", account);
            console.log("Document Hash:", formattedHash);
            console.log("DataHaven ID:", datahavenId, "Length:", datahavenId.length);
            console.log("Contract Address:", await contract.getAddress());

            // Check if user is officer
            const isOfficer = await contract.officers(account);
            console.log("Is Officer?", isOfficer);

            if (!isOfficer) {
                alert("You are not an officer! Please add yourself as an officer first.");
                setIsLoading(false);
                return;
            }

            console.log("Attempting to register land...");

            const tx = await contract.registerLand(
                landId,
                account,
                formattedHash,
                datahavenId,
                { gasLimit: 500000 } // Explicitly set gas limit
            );

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed!");

            alert("Land Registered Successfully!");
            setFormData({ landId: '', ownerDetails: '', documentHash: '0x0000000000000000000000000000000000000000000000000000000000000000', datahavenId: '' });
            setSelectedFile(null);
        } catch (error) {
            console.error("=== REGISTRATION ERROR ===");
            console.error("Full error:", error);
            console.error("Error message:", error.message);
            console.error("Error reason:", error.reason);
            console.error("Error code:", error.code);
            console.error("Error data:", error.data);

            let errorMessage = "Registration failed: ";
            if (error.reason) {
                errorMessage += error.reason;
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Unknown error - check console for details";
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

    if (!account) {
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
                            <label className="block text-gray-700 font-semibold mb-2">Owner Details (Optional)</label>
                            <input
                                type="text"
                                placeholder="Name, Address, etc."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.ownerDetails}
                                onChange={(e) => setFormData({ ...formData, ownerDetails: e.target.value })}
                            />
                        </div>

                        <div>
<<<<<<< HEAD
                            <label className="block text-gray-700 font-semibold mb-2">Document Upload (PNG/PDF)</label>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/png,application/pdf"
=======
                            <label className="block text-gray-700 font-semibold mb-2">Document (PNG/JPEG Upload)</label>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
>>>>>>> 9565df375743698e9d91ec802b299d8f9534a8b0
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                                <button
                                    type="button"
                                    onClick={uploadToPinata}
                                    disabled={uploading || !selectedFile}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                                >
                                    {uploading ? '⏳' : '📤 Upload'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Upload to IPFS via Pinata</p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">IPFS CID (Editable)</label>
                            <input
                                type="text"
                                placeholder="Will be filled after upload"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.datahavenId}
                                onChange={(e) => setFormData({ ...formData, datahavenId: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-filled after upload, but you can edit it</p>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-semibold mb-2">Document Hash (Auto-filled)</label>
                            <input
                                type="text"
                                placeholder="Keccak-256 Hash"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-100"
                                value={formData.documentHash}
                                onChange={(e) => setFormData({ ...formData, documentHash: e.target.value })}
                                readOnly
                            />
                            <p className="text-xs text-gray-500 mt-1">Generated automatically from uploaded file</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : '📝 Register Land'}
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
                            <button type="submit" className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all">
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

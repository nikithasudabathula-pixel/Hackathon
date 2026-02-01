import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Search, ArrowRightLeft, User, FileText, ShieldCheck, Upload } from 'lucide-react';
import { ethers } from 'ethers';

const TransferOwnership = () => {
    const { getContract, account } = useWeb3();

    // Search state
    const [searchId, setSearchId] = useState('');
    const [landData, setLandData] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Transfer state
    const [transferData, setTransferData] = useState({
        newOwner: '',
        newHash: '',
        newCID: ''
    });
    const [transferring, setTransferring] = useState(false);

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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

            setTransferData(prev => ({
                ...prev,
                newCID: cid,
                newHash: hash
            }));

            alert(`Document uploaded! CID: ${cid}`);

        } catch (error) {
            console.error("Upload Error:", error);
            alert("Error uploading document: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        setSearchError('');
        setLandData(null);

        try {
            const contract = await getContract();
            if (!contract) {
                setSearchError('Contract not available');
                return;
            }

            const land = await contract.getLand(searchId);

            // Format land data
            const formatted = {
                id: searchId,
                owner: land[0],
                documentHash: land[1],
                datahavenId: land[2],
                disputed: land[3],
                timestamp: new Date(Number(land[4]) * 1000).toLocaleString()
            };

            setLandData(formatted);

            // Check if current user is the owner
            if (account && formatted.owner.toLowerCase() !== account.toLowerCase()) {
                setSearchError('You are not the owner of this land');
            }

            if (formatted.disputed) {
                setSearchError('This land is currently disputed and cannot be transferred');
            }

        } catch (error) {
            console.error('Search error:', error);
            setSearchError('Land not found or error fetching data');
        } finally {
            setSearching(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();

        if (!landData) {
            alert('Please search for a land first');
            return;
        }

        if (!transferData.newOwner || !transferData.newHash || !transferData.newCID) {
            alert('Please fill all fields');
            return;
        }

        // Validate Ethereum address
        if (!ethers.isAddress(transferData.newOwner)) {
            alert('Invalid Ethereum address');
            return;
        }

        setTransferring(true);

        try {
            const contract = await getContract();

            // Ensure hash is in bytes32 format
            let formattedHash = transferData.newHash;
            if (!transferData.newHash.startsWith('0x')) {
                formattedHash = ethers.id(transferData.newHash);
            }

            console.log('Transferring land...');
            console.log('Land ID:', searchId);
            console.log('New Owner:', transferData.newOwner);
            console.log('New Hash:', formattedHash);
            console.log('New CID:', transferData.newCID);

            const tx = await contract.transferLand(
                searchId,
                transferData.newOwner,
                formattedHash,
                transferData.newCID,
                { gasLimit: 500000 }
            );

            console.log('Transaction sent:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed!');

            alert('✅ Ownership transferred successfully!');

            // Reset form
            setSearchId('');
            setLandData(null);
            setTransferData({ newOwner: '', newHash: '', newCID: '' });

        } catch (error) {
            console.error('Transfer error:', error);
            alert('Transfer failed: ' + (error.reason || error.message));
        } finally {
            setTransferring(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
                    <ShieldCheck size={64} className="mx-auto text-blue-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600 mb-6">You need to connect your wallet to transfer land ownership</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <ArrowRightLeft size={40} className="text-blue-600" />
                        <h1 className="text-4xl font-extrabold text-gray-800">Transfer Land Ownership</h1>
                    </div>
                    <p className="text-gray-600">Search for your land and transfer ownership to a new owner</p>
                </div>

                {/* Search Section */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Search className="text-indigo-600" size={28} />
                        <h2 className="text-2xl font-bold text-gray-800">Search Land</h2>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-3">
                        <input
                            type="number"
                            placeholder="Enter Land ID"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            <Search size={20} />
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {searchError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            ⚠️ {searchError}
                        </div>
                    )}
                </div>

                {/* Land Details */}
                {landData && !searchError && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FileText size={28} className="text-blue-600" />
                            Land Details - ID: {landData.id}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <InfoRow label="Current Owner" value={landData.owner} />
                            <InfoRow label="Status" value={landData.disputed ? '🔴 Disputed' : '🟢 Clear'} />
                            <InfoRow label="IPFS CID" value={landData.datahavenId} />
                            <InfoRow label="Document Hash" value={`${landData.documentHash.slice(0, 20)}...`} />
                            <InfoRow label="Registered" value={landData.timestamp} />
                        </div>

                        {landData.owner.toLowerCase() === account.toLowerCase() && !landData.disputed && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                                <ShieldCheck size={20} />
                                <span className="font-semibold">✓ You are the owner. You can transfer this land.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Transfer Form */}
                {landData && !searchError && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="text-green-600" size={28} />
                            <h2 className="text-2xl font-bold text-gray-800">Transfer Ownership</h2>
                        </div>

                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    New Owner Address *
                                </label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    value={transferData.newOwner}
                                    onChange={(e) => setTransferData({ ...transferData, newOwner: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter the Ethereum address of the new owner</p>
                            </div>

                            {/* Upload Section */}
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                                <div className="flex items-center gap-3 mb-4">
                                    <Upload className="text-blue-600" size={24} />
                                    <h3 className="font-bold text-gray-800">Upload New Ownership Document</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload PNG/PDF for the new owner (auto-fills hash & CID)
                                </p>
                                <div className="flex gap-3">
                                    <input
                                        type="file"
                                        accept=".png,.pdf"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={uploadToPinata}
                                        disabled={uploading || !selectedFile}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Upload size={18} />
                                        {uploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    New Document Hash *
                                </label>
                                <input
                                    type="text"
                                    placeholder="0x... or plain text (will be hashed)"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    value={transferData.newHash}
                                    onChange={(e) => setTransferData({ ...transferData, newHash: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Updated document hash for transfer</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    New IPFS CID *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Qm..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    value={transferData.newCID}
                                    onChange={(e) => setTransferData({ ...transferData, newCID: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Updated IPFS CID for new ownership document</p>
                            </div>

                            <button
                                type="submit"
                                disabled={transferring}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <ArrowRightLeft size={24} />
                                {transferring ? 'Transferring...' : 'Transfer Ownership'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="border-b border-gray-100 pb-2">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-semibold text-gray-800 break-all">{value}</p>
    </div>
);

export default TransferOwnership;

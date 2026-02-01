import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Search, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';
import { ethers } from 'ethers';

const RaiseDispute = () => {
    const { getContract, account } = useWeb3();

    // Search state
    const [searchId, setSearchId] = useState('');
    const [landData, setLandData] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Dispute state
    const [disputeReason, setDisputeReason] = useState('');
    const [depositAmount, setDepositAmount] = useState('0.01');
    const [disputing, setDisputing] = useState(false);

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

            // Check if already disputed
            if (formatted.disputed) {
                setSearchError('This land is already under dispute');
            }

            // Check if user is the owner
            if (account && formatted.owner.toLowerCase() === account.toLowerCase()) {
                setSearchError('You cannot raise a dispute on your own land');
            }

        } catch (error) {
            console.error('Search error:', error);
            setSearchError('Land not found or error fetching data');
        } finally {
            setSearching(false);
        }
    };

    const handleRaiseDispute = async (e) => {
        e.preventDefault();

        if (!landData) {
            alert('Please search for a land first');
            return;
        }

        if (!disputeReason.trim()) {
            alert('Please provide a reason for the dispute');
            return;
        }

        const depositEth = parseFloat(depositAmount);
        if (depositEth < 0.01) {
            alert('Minimum deposit is 0.01 ETH');
            return;
        }

        setDisputing(true);

        try {
            const contract = await getContract();

            console.log('Raising dispute...');
            console.log('Land ID:', searchId);
            console.log('Reason:', disputeReason);
            console.log('Deposit:', depositEth, 'ETH');

            const tx = await contract.raiseDispute(
                searchId,
                disputeReason,
                {
                    value: ethers.parseEther(depositAmount),
                    gasLimit: 500000
                }
            );

            console.log('Transaction sent:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed!');

            alert('✅ Dispute raised successfully!');

            // Reset form
            setSearchId('');
            setLandData(null);
            setDisputeReason('');
            setDepositAmount('0.01');

        } catch (error) {
            console.error('Dispute error:', error);
            alert('Failed to raise dispute: ' + (error.reason || error.message));
        } finally {
            setDisputing(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
                    <ShieldAlert size={64} className="mx-auto text-red-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600 mb-6">You need to connect your wallet to raise disputes</p>
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
                        <AlertTriangle size={40} className="text-red-600" />
                        <h1 className="text-4xl font-extrabold text-gray-800">Raise Land Dispute</h1>
                    </div>
                    <p className="text-gray-600">Search for land and raise a dispute with supporting evidence</p>
                </div>

                {/* Info Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                    <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Important Information:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Minimum deposit: <strong>0.01 ETH</strong></li>
                            <li>You cannot dispute land you own</li>
                            <li>Deposits are refunded if dispute is deemed valid</li>
                            <li>False disputes may result in deposit forfeiture</li>
                        </ul>
                    </div>
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
                            <InfoRow label="Owner" value={landData.owner} />
                            <InfoRow label="Status" value={landData.disputed ? '🔴 Disputed' : '🟢 Clear'} />
                            <InfoRow label="IPFS CID" value={landData.datahavenId} />
                            <InfoRow label="Document Hash" value={`${landData.documentHash.slice(0, 20)}...`} />
                            <InfoRow label="Registered" value={landData.timestamp} />
                        </div>

                        {!landData.disputed && landData.owner.toLowerCase() !== account.toLowerCase() && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 flex items-center gap-2">
                                <ShieldAlert size={20} />
                                <span className="font-semibold">✓ You can raise a dispute on this land.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Dispute Form */}
                {landData && !searchError && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="text-red-600" size={28} />
                            <h2 className="text-2xl font-bold text-gray-800">Raise Dispute</h2>
                        </div>

                        <form onSubmit={handleRaiseDispute} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Reason for Dispute *
                                </label>
                                <textarea
                                    placeholder="Explain why you are disputing this land ownership..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
                                    value={disputeReason}
                                    onChange={(e) => setDisputeReason(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Provide detailed reasons and evidence for your dispute
                                </p>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Deposit Amount (ETH) *
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0.01"
                                    placeholder="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Minimum: 0.01 ETH. Refunded if dispute is valid.
                                </p>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800">
                                    <strong>⚠️ Warning:</strong> By raising a dispute, you are staking <strong>{depositAmount} ETH</strong>.
                                    If your dispute is deemed invalid by officers, you may lose your deposit.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={disputing}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={24} />
                                {disputing ? 'Raising Dispute...' : `Raise Dispute (Stake ${depositAmount} ETH)`}
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

export default RaiseDispute;

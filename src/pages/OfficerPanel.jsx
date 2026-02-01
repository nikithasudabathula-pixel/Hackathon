import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Gavel } from 'lucide-react';

const OfficerPanel = () => {
    const { contract, account, isOwner, isOfficer, isLoading } = useWeb3();
    const [disputeId, setDisputeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleResolve = async (valid) => {
        if (!disputeId) return alert("Enter Land ID");
        setLoading(true);
        setMessage('');

        try {
            const tx = await contract.resolveDispute(disputeId, valid);
            await tx.wait();
            setMessage(`Dispute ${valid ? 'validated' : 'rejected'} successfully!`);
            setDisputeId('');
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="pt-24 min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // Access Denied
    if (!isOwner && !isOfficer) {
        return (
            <div className="pt-24 min-h-screen flex flex-col items-center justify-center text-red-500">
                <Shield size={64} className="mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-gray-600 mt-2">Only contract officers can access this page.</p>
                <p className="text-sm text-gray-500 mt-4">Check the Debug Panel (bottom-right) for details.</p>
            </div>
        );
    }

    // Officer/Owner View
    return (
        <div className="pt-24 min-h-screen px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Gavel size={32} className="text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Officer Panel</h1>
                    </div>

                    <p className="text-gray-600 mb-8">
                        Review and resolve land ownership disputes.
                    </p>

                    {/* Resolve Dispute */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                            <Gavel size={24} />
                            Resolve Dispute
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Land ID
                                </label>
                                <input
                                    type="number"
                                    value={disputeId}
                                    onChange={(e) => setDisputeId(e.target.value)}
                                    placeholder="Enter Land ID"
                                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleResolve(true)}
                                    disabled={loading || !account}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Processing...' : 'Validate Dispute'}
                                </button>
                                <button
                                    onClick={() => handleResolve(false)}
                                    disabled={loading || !account}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Processing...' : 'Reject Dispute'}
                                </button>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
                        <strong>Note:</strong> As an officer, you have the authority to review disputes and make final decisions
                        on land ownership claims. Use this power responsibly.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfficerPanel;

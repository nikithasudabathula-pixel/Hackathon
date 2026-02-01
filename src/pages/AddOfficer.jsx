import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, UserPlus } from 'lucide-react';

const AddOfficer = () => {
    const { account, isOwner, isLoading, contract } = useWeb3();
    const [officerAddress, setOfficerAddress] = useState('');
    const [status, setStatus] = useState(true); // true = add, false = remove
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contract || !officerAddress) return;

        setSubmitting(true);
        setMessage('');

        try {
            const tx = await contract.setOfficer(officerAddress, status);
            await tx.wait();
            setMessage(`Successfully ${status ? 'added' : 'removed'} officer!`);
            setOfficerAddress('');
        } catch (error) {
            console.error(error);
            setMessage(error.message || 'Transaction failed');
        } finally {
            setSubmitting(false);
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
    if (!isOwner) {
        return (
            <div className="pt-24 min-h-screen flex flex-col items-center justify-center text-red-500">
                <Shield size={64} className="mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-gray-600 mt-2">Only the contract owner (Deployer) can access this page.</p>
                <p className="text-sm text-gray-500 mt-4">Check the Debug Panel (bottom-right) for details.</p>
            </div>
        );
    }

    // Owner View
    return (
        <div className="pt-24 min-h-screen px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <UserPlus size={32} className="text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Manage Officers</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Add or remove officers who can approve land registrations and resolve disputes.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Officer Address
                            </label>
                            <input
                                type="text"
                                value={officerAddress}
                                onChange={(e) => setOfficerAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Action
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value === 'true')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="true">Add Officer</option>
                                <option value="false">Remove Officer</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !account}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Processing...' : status ? 'Add Officer' : 'Remove Officer'}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-4 p-4 rounded-lg ${message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddOfficer;

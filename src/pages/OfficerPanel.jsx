import React, { useState, useContext, useEffect } from 'react';
import { LandRegistryContext } from '../context/LandRegistryContext';
import { Shield, UserCheck, Gavel } from 'lucide-react';

const OfficerPanel = () => {
    const { getContract, currentAccount, connectWallet } = useContext(LandRegistryContext);
    const [isOwner, setIsOwner] = useState(false);
    const [isOfficer, setIsOfficer] = useState(false);

    const [officerAddress, setOfficerAddress] = useState('');
    const [officerStatus, setOfficerStatus] = useState(true);
    const [ownerAddress, setOwnerAddress] = useState('');

    const [disputeId, setDisputeId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            if (!currentAccount) return;
            const contract = await getContract();
            if (!contract) return;

            try {
                const owner = await contract.owner();
                setOwnerAddress(owner);
                setIsOwner(owner.toLowerCase() === currentAccount.toLowerCase());

                const officerStatus = await contract.officers(currentAccount);
                setIsOfficer(officerStatus);
            } catch (err) {
                console.error(err);
            }
        };
        checkRole();
    }, [currentAccount, getContract]);

    const handleSetOfficer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.setOfficer(officerAddress, officerStatus);
            await tx.wait();
            alert(`Officer ${officerStatus ? 'Added' : 'Removed'} Successfully`);
            setOfficerAddress('');
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (valid) => {
        if (!disputeId) return alert("Enter Land ID");
        setLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.resolveDispute(disputeId, valid);
            await tx.wait();
            alert("Dispute Resolved");
            setDisputeId('');
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentAccount) return <div className="pt-24 text-center"><button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-full">Connect Wallet</button></div>;

    if (!isOwner && !isOfficer) {
        return (
            <div className="pt-24 min-h-screen flex flex-col items-center justify-center text-red-500">
                <Shield size={64} className="mb-4" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p>You are not an authorized officer or admin.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-4 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-4xl mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Shield className="text-blue-600" /> Officer Panel
                </h1>
                {ownerAddress && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-blue-800">
                        <UserCheck size={20} />
                        <span className="font-semibold">Current Contract Owner:</span>
                        <span className="font-mono text-sm break-all">{ownerAddress}</span>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                {isOwner && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <UserCheck className="text-blue-500" />
                            <h2 className="text-xl font-bold text-gray-800">Manage Officers</h2>
                        </div>
                        <form onSubmit={handleSetOfficer} className="flex flex-col gap-4">
                            <input
                                className="p-3 border rounded-lg"
                                placeholder="Officer Address"
                                value={officerAddress}
                                onChange={e => setOfficerAddress(e.target.value)}
                                required
                            />
                            <div className="flex items-center gap-2">
                                <label className="font-semibold">Status:</label>
                                <select
                                    className="p-2 border rounded"
                                    value={officerStatus}
                                    onChange={e => setOfficerStatus(e.target.value === 'true')}
                                >
                                    <option value="true">Active (Add)</option>
                                    <option value="false">Inactive (Remove)</option>
                                </select>
                            </div>
                            <button disabled={loading} type="submit" className="bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                                {loading ? 'Processing...' : 'Update Officer'}
                            </button>
                        </form>
                    </div>
                )}

                {(isOfficer || isOwner) && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Gavel className="text-indigo-500" />
                            <h2 className="text-xl font-bold text-gray-800">Quick Dispute Resolution</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            <input
                                className="p-3 border rounded-lg"
                                placeholder="Land ID to Resolve"
                                type="number"
                                value={disputeId}
                                onChange={e => setDisputeId(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <button disabled={loading} onClick={() => handleResolve(true)} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold hover:bg-green-600">
                                    Valid
                                </button>
                                <button disabled={loading} onClick={() => handleResolve(false)} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600">
                                    Invalid
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfficerPanel;

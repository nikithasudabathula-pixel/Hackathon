import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { ShieldAlert, CheckCircle, User, FileText, Clock, AlertTriangle } from 'lucide-react';

const LandDetails = () => {
    const { id } = useParams();
    const { getContract, account, connectWallet } = useWeb3();
    const [land, setLand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isOfficer, setIsOfficer] = useState(false);

    // Form States
    const [transferData, setTransferData] = useState({ newOwner: '', newHash: '', newCID: '' });
    const [disputeReason, setDisputeReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchLandDetails = async () => {
            try {
                const contract = await getContract();
                if (!contract) return;

                const landData = await contract.getLand(id);
                // landData is array/struct: [owner, documentHash, Datahavenid, disputed, timestamp]

                // Formatted object
                const formattedLand = {
                    id: id,
                    owner: landData[0],
                    documentHash: landData[1],
                    datahavenId: landData[2],
                    disputed: landData[3],
                    timestamp: new Date(Number(landData[4]) * 1000).toLocaleString()
                };

                setLand(formattedLand);

                if (account) {
                    setIsOwner(account.toLowerCase() === formattedLand.owner.toLowerCase());
                    const officerStatus = await contract.officers(account);
                    setIsOfficer(officerStatus);
                }
            } catch (error) {
                console.error("Error fetching land:", error);
                // Handle non-existent land (might revert)
                setLand(null);
            } finally {
                setLoading(false);
            }
        };

        if (account) {
            fetchLandDetails();
        } else {
            // If not connected, we still might want to try reading if we have a provider?
            // Context uses BrowserProvider which needs wallet. 
            // Ideally we should have a JsonRpcProvider fallback for read-only.
            // For now, require connection.
            setLoading(false);
        }
    }, [id, account, getContract]);


    const handleTransfer = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.transferLand(id, transferData.newOwner, transferData.newHash, transferData.newCID);
            await tx.wait();
            alert("Ownership transferred!");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Transfer failed: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRaiseDispute = async () => {
        if (!disputeReason) return alert("Enter a reason");
        setActionLoading(true);
        try {
            const contract = await getContract();
            // raiseDispute is payable? ABI says yes. But how much? Contract logic depends.
            // Usually needs value. Assuming 0 for now or user sends default.
            // If contract requires 'disputeDeposits', we might need to send value.
            // Let's assume standard interaction without value for now unless error.
            const tx = await contract.raiseDispute(id, disputeReason);
            await tx.wait();
            alert("Dispute raised!");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Failed to raise dispute: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolveDispute = async (valid) => {
        setActionLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.resolveDispute(id, valid);
            await tx.wait();
            alert(`Dispute resolved as ${valid ? 'Valid' : 'Invalid'}`);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Failed to resolve: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (!account) return <div className="pt-24 text-center"><button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-full">Connect Wallet to View</button></div>;
    if (loading) return <div className="pt-24 text-center">Loading Land Details...</div>;
    if (!land) return <div className="pt-24 text-center text-red-500 font-bold">Land Not Found (ID: {id})</div>;

    return (
        <div className="min-h-screen pt-24 px-4 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                {land.disputed && (
                    <div className="absolute top-0 left-0 w-full bg-red-500 text-white py-2 text-center font-bold flex items-center justify-center gap-2">
                        <AlertTriangle size={20} /> THIS LAND IS CURRENTLY DISPUTED
                    </div>
                )}

                <div className="mt-8 grid md:grid-cols-2 gap-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                            <FileText size={32} /> Land ID: {land.id}
                        </h1>

                        <div className="space-y-4">
                            <DetailRow icon={<User size={20} />} label="Owner" value={land.owner} />
                            <DetailRow icon={<ShieldAlert size={20} />} label="DataHaven ID" value={land.datahavenId} />
                            <DetailRow icon={<FileText size={20} />} label="Document Hash" value={land.documentHash.slice(0, 20) + "..."} fullValue={land.documentHash} />
                            <DetailRow icon={<Clock size={20} />} label="Registered" value={land.timestamp} />
                            <div className="flex items-center gap-2 mt-4">
                                <span className="font-bold text-gray-700">Status:</span>
                                {land.disputed ?
                                    <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={16} /> Disputed</span> :
                                    <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={16} /> Clear</span>
                                }
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        {isOwner && !land.disputed && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Transfer Ownership</h3>
                                <form onSubmit={handleTransfer} className="space-y-3">
                                    <input className="w-full p-2 border rounded" placeholder="New Owner Address" value={transferData.newOwner} onChange={e => setTransferData({ ...transferData, newOwner: e.target.value })} required />
                                    <input className="w-full p-2 border rounded" placeholder="New Document Hash" value={transferData.newHash} onChange={e => setTransferData({ ...transferData, newHash: e.target.value })} required />
                                    <input className="w-full p-2 border rounded" placeholder="New CID" value={transferData.newCID} onChange={e => setTransferData({ ...transferData, newCID: e.target.value })} required />
                                    <button disabled={actionLoading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                                        {actionLoading ? 'Transferring...' : 'Transfer Land'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {!isOwner && !land.disputed && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Raise Dispute</h3>
                                <textarea className="w-full p-2 border rounded mb-3" placeholder="Reason for dispute..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} />
                                <button disabled={actionLoading} onClick={handleRaiseDispute} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 font-bold">
                                    {actionLoading ? 'Processing...' : 'Raise Dispute'}
                                </button>
                            </div>
                        )}

                        {isOfficer && land.disputed && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Resolve Dispute</h3>
                                <div className="flex gap-4">
                                    <button disabled={actionLoading} onClick={() => handleResolveDispute(true)} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 font-bold">
                                        Valid (Keep Owner)
                                    </button>
                                    <button disabled={actionLoading} onClick={() => handleResolveDispute(false)} className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 font-bold">
                                        Invalid (Reject)
                                    </button>
                                </div>
                            </div>
                        )}

                        {land.disputed && !isOfficer && (
                            <div className="text-center text-gray-500 italic mt-4">
                                Dispute resolution in progress.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, fullValue }) => (
    <div className="flex flex-col border-b border-gray-100 pb-2 last:border-0">
        <span className="flex items-center gap-2 text-sm text-gray-500 mb-1">{icon} {label}</span>
        <span className="font-semibold text-gray-800 break-all" title={fullValue}>{value}</span>
    </div>
);

export default LandDetails;

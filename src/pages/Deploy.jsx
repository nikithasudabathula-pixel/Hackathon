import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Rocket, CheckCircle } from 'lucide-react';

const Deploy = () => {
    const { deployContract, account, connectWallet, updateContractAddress } = useWeb3();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle, deploying, success, error
    const [newAddress, setNewAddress] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleDeploy = async () => {
        if (!account) return alert("Connect Wallet First");
        setStatus('deploying');
        setErrorMsg('');
        try {
            const address = await deployContract();
            setNewAddress(address);
            updateContractAddress(address); // Save the new address
            setStatus('success');

            // Auto-redirect to Add Officer after 2 seconds
            setTimeout(() => {
                navigate('/add-officer');
            }, 2000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMsg(error.reason || error.message || "Deployment Failed");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(newAddress);
        alert('Address copied!');
    };

    return (
        <div className="pt-24 min-h-screen flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-10">
                <div className="flex flex-col items-center mb-6">
                    <Rocket size={48} className="text-blue-600 mb-4" />
                    <h1 className="text-4xl font-bold text-gray-800">Deploy Contract</h1>
                    <p className="text-gray-600 text-center mt-3">
                        Deploy a new instance of the Land Registry smart contract to the blockchain.
                        This will set you as the owner and administrator.
                    </p>
                </div>

                {status === 'idle' && (
                    <div className="text-center">
                        {!account ? (
                            <button
                                onClick={connectWallet}
                                className="px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                            >
                                Connect Wallet First
                            </button>
                        ) : (
                            <button
                                onClick={handleDeploy}
                                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                Deploy to Sepolia
                            </button>
                        )}
                    </div>
                )}

                {status === 'deploying' && (
                    <div className="text-center animate-pulse">
                        <div className="text-2xl font-bold text-blue-600 mb-4">Deploying...</div>
                        <p className="text-gray-600">Please confirm the transaction in MetaMask and wait...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                            <CheckCircle size={32} />
                            <span className="text-2xl font-bold">Deployed!</span>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg break-all mb-4 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Contract Address</p>
                            <p className="font-mono text-gray-800 font-bold">{newAddress}</p>
                        </div>
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm text-center mb-6 border border-green-100">
                            <strong>Success!</strong> Redirecting you to Add Officer page...
                        </div>
                        <button
                            onClick={() => { setStatus('idle'); setNewAddress(''); }}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Deploy Another
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center animate-fade-in-up">
                        <div className="text-2xl font-bold text-red-600 mb-4">Deployment Failed</div>
                        <p className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 break-all mb-6">
                            {errorMsg}
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Deploy;

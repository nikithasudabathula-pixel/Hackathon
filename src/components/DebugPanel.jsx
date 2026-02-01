import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Bug, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const DebugPanel = () => {
    const { debugInfo, errors, clearErrors } = useWeb3();
    const [isOpen, setIsOpen] = useState(false);

    const StatusIcon = ({ condition }) => {
        if (condition === null || condition === undefined) {
            return <AlertCircle size={16} className="text-yellow-500" />;
        }
        return condition ? (
            <CheckCircle size={16} className="text-green-500" />
        ) : (
            <XCircle size={16} className="text-red-500" />
        );
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="mb-2 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors ml-auto"
            >
                <Bug size={20} />
                <span className="font-semibold">Debug Panel</span>
                {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {/* Panel Content */}
            {isOpen && (
                <div className="bg-white border-2 border-gray-800 rounded-lg shadow-2xl p-4 max-h-96 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Bug size={20} />
                        Debug Information
                    </h3>

                    {/* Errors Section */}
                    {errors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-red-700 flex items-center gap-1">
                                    <AlertCircle size={16} />
                                    Errors ({errors.length})
                                </h4>
                                <button
                                    onClick={clearErrors}
                                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                >
                                    Clear
                                </button>
                            </div>
                            {errors.map((error, idx) => (
                                <div key={idx} className="text-xs text-red-600 mb-1 font-mono break-all">
                                    {error}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Connection Info */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.isConnected} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Wallet Connection</div>
                                <div className="text-xs text-gray-600 font-mono break-all">
                                    {debugInfo.account || 'Not connected'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.chainId !== null} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Network / Chain ID</div>
                                <div className="text-xs text-gray-600">
                                    {debugInfo.chainId || 'Unknown'}
                                    {debugInfo.chainId === 11155111 && ' (Sepolia Testnet)'}
                                    {debugInfo.chainId === 1 && ' (Ethereum Mainnet)'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.contractCodeExists} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Contract Address</div>
                                <div className="text-xs text-gray-600 font-mono break-all">
                                    {debugInfo.contractAddress}
                                </div>
                                {debugInfo.localStorageValue && debugInfo.localStorageValue !== debugInfo.contractAddress && (
                                    <div className="text-xs text-yellow-600 mt-1">
                                        ⚠️ localStorage: {debugInfo.localStorageValue}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.contractOwner !== null} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Contract Owner</div>
                                <div className="text-xs text-gray-600 font-mono break-all">
                                    {debugInfo.contractOwner || 'Unknown'}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 my-2"></div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.isOwner} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Is Owner?</div>
                                <div className="text-xs text-gray-600">
                                    {debugInfo.isOwner ? 'Yes ✓' : 'No'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.isOfficer} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Is Officer?</div>
                                <div className="text-xs text-gray-600">
                                    {debugInfo.isOfficer ? 'Yes ✓' : 'No'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <StatusIcon condition={debugInfo.contractCodeExists} />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-700">Contract Code Exists?</div>
                                <div className="text-xs text-gray-600">
                                    {debugInfo.contractCodeExists ? 'Yes ✓' : 'No (wrong network?)'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <button
                            onClick={() => {
                                localStorage.removeItem('landRegistryContractAddress');
                                window.location.reload();
                            }}
                            className="w-full text-xs bg-red-100 text-red-700 py-2 rounded font-semibold hover:bg-red-200"
                        >
                            Reset Contract Address & Reload
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress as defaultContractAddress } from '../utils/contract';
import { contractBytecode } from '../utils/bytecode';

const Web3Context = createContext();

const STORAGE_KEY = 'landRegistryContractAddress';

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    // Connection state
    const [account, setAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState(null);

    // Contract state
    const [contractAddress, setContractAddress] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || defaultContractAddress;
    });
    const [contract, setContract] = useState(null);

    // Role state
    const [isOwner, setIsOwner] = useState(false);
    const [isOfficer, setIsOfficer] = useState(false);
    const [contractOwner, setContractOwner] = useState(null);

    // Status state
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [contractCodeExists, setContractCodeExists] = useState(false);

    // Add error
    const addError = useCallback((error) => {
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        setErrors(prev => [...new Set([...prev, errorMsg])]);
    }, []);

    // Clear errors
    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);

    // Get fresh contract instance
    const getContract = useCallback(async () => {
        if (!window.ethereum) {
            addError('MetaMask not installed');
            return null;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Always read fresh address from localStorage
            const freshAddress = localStorage.getItem(STORAGE_KEY) || defaultContractAddress;

            const contractInstance = new ethers.Contract(freshAddress, contractABI, signer);
            return contractInstance;
        } catch (error) {
            addError(error);
            return null;
        }
    }, [addError]);

    // Update contract address
    const updateContractAddress = useCallback((newAddress) => {
        localStorage.setItem(STORAGE_KEY, newAddress);
        setContractAddress(newAddress);
        // Force re-check of roles
        setIsLoading(true);
    }, []);

    // Connect wallet
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            addError('Please install MetaMask');
            return;
        }

        try {
            clearErrors();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setAccount(address);
            setChainId(Number(network.chainId));
            setIsConnected(true);
        } catch (error) {
            addError(error);
        }
    }, [addError, clearErrors]);

    // Check wallet connection on mount
    useEffect(() => {
        const checkConnection = async () => {
            if (!window.ethereum) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send('eth_accounts', []);

                if (accounts.length > 0) {
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    const network = await provider.getNetwork();

                    setAccount(address);
                    setChainId(Number(network.chainId));
                    setIsConnected(true);
                }
            } catch (error) {
                console.error('Failed to check connection:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkConnection();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setAccount(null);
                setIsConnected(false);
                setIsOwner(false);
                setIsOfficer(false);
            } else {
                setAccount(accounts[0]);
                setIsLoading(true); // Trigger role re-check
            }
        };

        const handleChainChanged = (chainIdHex) => {
            setChainId(parseInt(chainIdHex, 16));
            setIsLoading(true); // Trigger role re-check
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    // Check roles whenever account or contract changes
    useEffect(() => {
        const checkRoles = async () => {
            if (!account || !isConnected) {
                setIsOwner(false);
                setIsOfficer(false);
                setContractOwner(null);
                setContractCodeExists(false);
                setIsLoading(false);
                return;
            }

            try {
                clearErrors();
                const contractInstance = await getContract();

                if (!contractInstance) {
                    setIsLoading(false);
                    return;
                }

                // Check if contract code exists
                const provider = new ethers.BrowserProvider(window.ethereum);
                const currentAddress = await contractInstance.getAddress();
                const code = await provider.getCode(currentAddress);

                if (code === '0x') {
                    setContractCodeExists(false);
                    addError(`No contract found at ${currentAddress}. Wrong network or not deployed.`);
                    setIsOwner(false);
                    setIsOfficer(false);
                    setContractOwner(null);
                    setIsLoading(false);
                    return;
                }

                setContractCodeExists(true);
                setContract(contractInstance);

                // Since this contract doesn't have owner() function, we'll set owner through deployment
                // For now, assume deployer is owner - this will be set correctly after deployment
                setContractOwner(account); // Temporary - will be updated after deployment

                // Try to check if user is owner by attempting a test call
                // If setOfficer would work, user is owner
                try {
                    // Just check if we're an officer
                    const officerStatus = await contractInstance.officers(account);
                    setIsOfficer(officerStatus);

                    // Assume the deployer (account in localStorage from deploy) is owner
                    // This is a workaround since contract doesn't expose owner()
                    const deployerAccount = localStorage.getItem('landRegistryDeployer');
                    if (deployerAccount && deployerAccount.toLowerCase() === account.toLowerCase()) {
                        setIsOwner(true);
                        setContractOwner(account);
                    } else {
                        setIsOwner(false);
                    }
                } catch (err) {
                    console.error('Officer check failed:', err);
                    setIsOfficer(false);
                    setIsOwner(false);
                }

            } catch (error) {
                console.error('Role check error:', error);
                addError(error);
                setIsOwner(false);
                setIsOfficer(false);
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoading && account) {
            checkRoles();
        }
    }, [account, isConnected, contractAddress, isLoading, getContract, addError, clearErrors]);

    // Deploy contract
    const deployContract = useCallback(async () => {
        if (!account) {
            throw new Error('Connect wallet first');
        }

        try {
            clearErrors();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();

            const factory = new ethers.ContractFactory(contractABI, contractBytecode, signer);

            // Deploy with owner address as constructor parameter
            const contract = await factory.deploy(signerAddress);
            await contract.waitForDeployment();

            const address = await contract.getAddress();

            // Save deployer address for ownership checking
            localStorage.setItem('landRegistryDeployer', signerAddress);

            return address;
        } catch (error) {
            addError(error);
            throw error;
        }
    }, [account, addError, clearErrors]);

    // Debug info
    const debugInfo = {
        account,
        isConnected,
        chainId,
        contractAddress,
        contractOwner,
        isOwner,
        isOfficer,
        contractCodeExists,
        errors,
        localStorageValue: localStorage.getItem(STORAGE_KEY),
    };

    const value = {
        // Connection
        account,
        isConnected,
        connectWallet,

        // Roles
        isOwner,
        isOfficer,
        contractOwner,
        isLoading,

        // Contract
        contract,
        getContract,
        contractAddress,
        updateContractAddress,
        contractCodeExists,

        // Network
        chainId,

        // Deployment
        deployContract,

        // Debug & Errors
        debugInfo,
        errors,
        clearErrors,
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

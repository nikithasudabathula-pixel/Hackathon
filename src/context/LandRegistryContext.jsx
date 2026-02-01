import React, { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/contract';
import { contractBytecode } from '../utils/bytecode';
import PropTypes from 'prop-types';

export const LandRegistryContext = createContext();

const { ethereum } = window;

export const LandRegistryProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  // NEW: State to hold the dynamic contract address
  const [currentContractAddress, setContractAddressState] = useState(contractAddress);

  useEffect(() => {
    // Load from localStorage on mount
    const storedAddress = localStorage.getItem('landRegistryContractAddress');
    if (storedAddress) {
      setContractAddressState(storedAddress);
    }
  }, []);

  const updateContractAddress = (newAddress) => {
    setContractAddressState(newAddress);
    localStorage.setItem('landRegistryContractAddress', newAddress);
  };

  // Check if wallet is connected
  const checkWalletConnection = async () => {
    try {
      if (!ethereum) return alert('Please install MetaMask');

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!ethereum) return alert('Please install MetaMask');

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('No ethereum object');
    }
  };

  // Get Contract Instance
  const getContract = async () => {
    if (ethereum) {
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      // Always read the freshest address from localStorage to avoid stale closures
      const freshAddress = localStorage.getItem('landRegistryContractAddress') || contractAddress;
      const landRegistryContract = new ethers.Contract(freshAddress, contractABI, signer);
      return landRegistryContract;
    }
    return null;
  };

  // Deploy Contract
  const deployContract = async () => {
    try {
      if (!ethereum) return alert('Please install MetaMask');
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      // Initializing factory with ABI, Bytecode, and Signer
      const factory = new ethers.ContractFactory(contractABI, contractBytecode, signer);

      console.log("Deploying contract...");
      // For legacy/standard compatibility, we can optionally pass gasLimit if needed, but usually auto-estimation works.
      const contract = await factory.deploy();

      console.log("Waiting for deployment...", contract);
      await contract.waitForDeployment();

      const address = await contract.getAddress();
      console.log("Deployed at:", address);
      return address;
    } catch (error) {
      console.error("Deployment failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    checkWalletConnection();
  }, []);

  return (
    <LandRegistryContext.Provider
      value={{
        connectWallet,
        currentAccount,
        getContract,
        deployContract,
        loading,
        setLoading,
        currentContractAddress, // Export current address
        updateContractAddress,  // Export updater function
      }}
    >
      {children}
    </LandRegistryContext.Provider>
  );
};

LandRegistryProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

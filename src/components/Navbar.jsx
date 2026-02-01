import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { account, connectWallet } = useWeb3();

  const shortenAddress = (address) => {
    return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
  };

  return (
    <nav className="w-full flex md:justify-center justify-between items-center p-4 gradient-bg-services shadow-md backdrop-blur-md bg-white/30 fixed z-50 top-0 text-gray-800 animate-slideInLeft">
      <div className="md:flex-[0.5] flex-initial justify-center items-center">
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover-grow">
          <ShieldCheck size={32} className="text-blue-600 animate-pulse" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            LandRegistry
          </span>
        </Link>
      </div>
      <ul className="text-black md:flex hidden list-none flex-row justify-between items-center flex-initial">
        {["Home", "Dashboard", "Transfer", "Dispute", "Officer", "Add Officer", "Deploy"].map((item, index) => (
          <li key={item + index} className="mx-4 cursor-pointer font-semibold hover:text-blue-500 transition-all hover-grow">
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase().replace(' ', '-')}`}>{item}</Link>
          </li>
        ))}
        <li className="bg-blue-600 py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg text-white btn-interactive">
          {!account ? (
            <button type="button" onClick={connectWallet} className="font-bold">
              Connect Wallet
            </button>
          ) : (
            <p className="font-bold cursor-default animate-glow">
              {shortenAddress(account)}
            </p>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;

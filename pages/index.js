import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import atm_abi from '../artifacts/contracts/Assessment.sol/Assessment.json';

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [balanceHistory, setBalanceHistory] = useState([]);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const handleDeposit = async () => {
    if (atm) {
      try {
        let tx = await atm.deposit(depositAmount);
        await tx.wait();
        getBalance();
        setDepositAmount(0); // Clear the input field

        // Update balance history after successful deposit
        setBalanceHistory([...balanceHistory, { timestamp: new Date().toISOString(), balance, type: 'Deposit', balanceChange: depositAmount }]);

      } catch (error) {
        console.error("Deposit failed:", error);
        // Handle error, e.g., display an error message to the user
      }
    }
  };

  const handleWithdraw = async () => {
    if (atm) {
      try {
        let tx = await atm.withdraw(withdrawAmount);
        await tx.wait();
        getBalance();
        setWithdrawAmount(0); // Clear the input field

        // Update balance history after successful withdrawal
        setBalanceHistory([...balanceHistory, { timestamp: new Date().toISOString(), balance, type: 'Withdrawal', balanceChange: -withdrawAmount }]);

      } catch (error) {
        console.error("Withdrawal failed:", error);
        // Handle error, e.g., display an error message to the user
      }
    }
  };

  const clearBalanceHistory = () => {
    setBalanceHistory([]);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Connect Your MetaMask Wallet</button>;
    }

    if (balance == undefined) {
      getBalance();
    }

    return (
      <div className="atm-container">
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance}</p>

        <div className="input-button-group">
          <input
            className="input-field"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseInt(e.target.value))}
            placeholder="Enter deposit amount"
          />
          <button onClick={handleDeposit}>Deposit</button>
        </div>

        <div className="input-button-group">
          <input
            className="input-field"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(parseInt(e.target.value))}
            placeholder="Enter withdrawal amount"
          />
          <button onClick={handleWithdraw}>Withdraw</button>
        </div>

        <div className="balance-history-container">
          <h2>Balance History</h2>
          <ul>
            {balanceHistory.map((tx, index) => (
              <li key={index}>
                <strong>Timestamp:</strong> {tx.timestamp}<br />
                <strong>Type:</strong> {tx.type}<br />
                <strong>Added/Deducted:</strong> {tx.balanceChange} ETH<br />
                <strong>New Balance:</strong> {tx.balance + tx.balanceChange} ETH
              </li>
            ))}
          </ul>
          <button onClick={clearBalanceHistory}>Clear History</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header className="header">
        <h1>Welcome to the Metacrafters!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          font-family: Arial, sans-serif;
        }

        .header {
          background-color: #33b3fc;
          padding: 20px;
          border-bottom: 1px solid #ccc;
        }

        .atm-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          color: #13608c;
        }

        .atm-container p {
          margin-bottom: 10px;
        }

        .atm-container input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .atm-container button {
          padding: 10px 20px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .input-button-group {
          display: flex;
          align-items: center;
        }

        .input-field {
          width: 150px; /* Adjust the width as needed */
          text-align: center;
        }

        .balance-history-container {
          height: 200px; /* Adjust the height as needed */
          overflow-y: scroll;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 10px;
        }

        .balance-history ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        .balance-history li {
          margin-bottom: 10px;
        }
      `}</style>
    </main>
  );
}
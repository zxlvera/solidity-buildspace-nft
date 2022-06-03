import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { providers, Contract } from "ethers";
import Web3Modal from "web3modal";
import { useState, useEffect, useRef } from "react";
import LimeNFT from "../utils/LimeNFT.json";

const appContainer = {
  display: "flex",
  padding: "4rem 0",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const header = {
  fontFamily: "KeeponTruckin",
  fontSize: "8rem",
  color: "#1E1E1E",
  textAlign: "center"
};

const mainContainer = {
  display: "flex",
  padding: "4rem 0",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
};

const walletBtnWrap = {
  position: "absolute",
  top: "2rem",
  right: "2rem",
};

const walletButton = {
  border: "none",
  outline: "none",
  background: "#FFD062",
  padding: "1rem 2rem",
  borderRadius: "1rem",
  fontFamily: "Montserrat",
  fontSize: "1.2rem",
  cursor: "pointer",
};

const nftLink = {
  marginTop: "1rem",
};

const ctaButton = ({ hover }) => ({
  border: "none",
  outline: "none",
  background: hover ? "#fd94d0" : "#ec6d8c",
  padding: "2rem 6rem",
  borderRadius: "2rem",
  fontFamily: "Montserrat",
  fontSize: "3rem",
  cursor: "pointer",
  color: "white",
});

const imgStyle = {
  maxWidth: "80vw",
  marginTop: "8px",
}

export default function Home() {
  const web3ModalRef = useRef();
  const contractABI = LimeNFT.abi;
  const [loading, setLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [link, setLink] = useState("");
  const [hover, setHover] = useState(false);

  // Constants
  const TWITTER_HANDLE = "_moonplant";
  const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
  const OPENSEA_LINK = "https://testnets.opensea.io/assets/rinkeby/";
  const TOTAL_MINT_COUNT = 50;

  // Web3Modal to get Provider or Signer
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      const txn = await getProviderOrSigner();
      setCurrentAccount(txn.provider.selectedAddress);
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  };

  const askContractToMintNft = async () => {
    const CONTRACT_ADDRESS = "0x17d0b1b611D575A8F3883C1b8D0Bec4657c7F467";

    try {
      const signer = await getProviderOrSigner(true);
      const connectedContract = new Contract(
        CONTRACT_ADDRESS,
        contractABI,
        signer
      );

      connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
        console.log(from, tokenId.toNumber());
        setLink(`${OPENSEA_LINK}${CONTRACT_ADDRESS}/${tokenId.toNumber()}`);
      });

      console.log("Going to pop wallet now to pay gas...");
      let nftTxn = await connectedContract.makeAnEpicNFT();

      console.log("Mining...please wait.");
      setLoading(true);
      await nftTxn.wait();
      setLoading(false);
      console.log(
        `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Functions - Connect Wallet when user lands on page
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button style={walletButton} onClick={connectWallet}>
          Connect Wallet
        </button>
      );
    } else {
      return <pre>{currentAccount}</pre>;
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Fruit Loops</title>
        <meta name="description" content="Mint your fruit loops today" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={appContainer}>
        <header>
          <h1 style={header}>Fruit Loops</h1>
          <div style={walletBtnWrap}>{renderButton()}</div>
        </header>
        <main style={mainContainer}>
          {currentAccount !== "" ? (
            /** Add askContractToMintNft Action for the onClick event **/
            <>
              <button
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                onClick={askContractToMintNft}
                style={ctaButton({ hover })}
              >
                Mint
              </button>
              <div style={nftLink}>
                {loading && (
                  <>
                    <p>Minting...</p>
                    <img style={imgStyle} src="https://i.giphy.com/media/yoJC2zh1Afnc9og4U0/giphy.webp" />
                  </>
                )}
                {!loading && link !== "" && (
                  <a href={link.toLowerCase()}>View your NFT on Opensea!</a>
                )}
              </div>
            </>
          ) : (
            <>
              <p>Welcome! Connect your wallet to mint an NFT.</p>
              <img src="https://i.giphy.com/media/yoJC2zh1Afnc9og4U0/giphy.webp" />
            </>
          )}
        </main>
      </div>
      <footer className={styles.footer}>
        <a
          className="footer-text"
          href={TWITTER_LINK}
          target="_blank"
          rel="noreferrer"
        >{`built by @${TWITTER_HANDLE}`}</a>
      </footer>
    </div>
  );
}

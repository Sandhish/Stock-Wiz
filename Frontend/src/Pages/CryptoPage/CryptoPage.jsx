import CryptoDetail from '../../Components/CryptoDetail/CryptoDetail';
import styles from './CryptoPage.module.css'
import { useParams } from 'react-router-dom';

const CryptoPage = () => {
  const { symbol } = useParams();

  return (
    <div className={styles.cryptoPageContainer}>
      <h1 className={styles.cryptoPageHeading}>Crypto Details: {symbol}</h1>
      <CryptoDetail />
    </div>
  );
};

export default CryptoPage;
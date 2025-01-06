import styles from './HomePage.module.css'
import CryptoList from '../../Components/CryptoList/CryptoList'

const HomePage = () => {
  return (
    <div className={styles.homepageContainer}>
      <h1 className={styles.homepageHeading}>Crypto Tracker</h1>
      <CryptoList />
    </div>
  )
}

export default HomePage
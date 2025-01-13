import styles from './HomePage.module.css'
import CryptoList from '../../Components/CryptoList/CryptoList'

const HomePage = () => {
  return (
    <div className={styles.homepageContainer}>
      <CryptoList />
    </div>
  )
}

export default HomePage
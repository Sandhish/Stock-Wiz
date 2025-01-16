import styles from './UserPage.module.css'
import CryptoList from '../../Components/CryptoList/CryptoList'

const UserPage = () => {
  return (
    <div className={styles.userPageContainer}>
      <CryptoList />
    </div>
  )
}

export default UserPage;
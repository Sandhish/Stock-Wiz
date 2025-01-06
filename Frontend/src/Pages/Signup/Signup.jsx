import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../Services/authService';
import styles from './Signup.module.css';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(formData);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
      console.log('Signed up successfully');
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className={styles.signupContainer}>
      <h2 className={styles.signupHeading}>Sign Up</h2>
      {error && <div className={styles.signupErr}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <input type="text" name="name" placeholder="Full Name" className={styles.signupInput}
          value={formData.name} onChange={handleInputChange} required />
        <input type="email" name="email" placeholder="Email Address" className={styles.signupInput}
          value={formData.email} onChange={handleInputChange} required />
        <input type="password" name="password" placeholder="Password" className={styles.signupInput}
          value={formData.password} onChange={handleInputChange} required />
        <button type="submit" className={styles.signupBtn}>Sign Up</button>
      </form>

      <p className={styles.signupText}>
        Already have an account? <a href="/login" className={styles.signupLink}>Login here</a>
      </p>
    </div>
  );
};

export default Signup;

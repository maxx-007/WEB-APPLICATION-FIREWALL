function Login({ setIsAuthenticated }) {
    const handleLogin = () => {
      setIsAuthenticated(true);
    };
  
    return (
      <div className="login-page">
        <h1>Login</h1>
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }
  
  export default Login;
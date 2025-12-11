import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

const App = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);  // Token из Redux

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!token) return null;  // Не рендерим, пока редирект

  return (
    <Container className="app">
      <h1>Добро пожаловать в чат! (Токен: {token.substring(0, 20)}...)</h1>
      <p>Здесь будет список каналов и сообщений.</p>
    </Container>
  );
};

export default App;

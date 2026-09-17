import React, { useEffect, useState } from 'react';
import GerenciadorBucket from './pages/GerenciadorBucket';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Slide from '@mui/material/Slide';

const AUTH_LOGIN_URL = '/login';

// extrai o payload e valida se o JWT está expirar
function parseTokenData(token: string | null): { email: string | null; isExpired: boolean } {
  if (!token) return { email: null, isExpired: true };
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return { email: null, isExpired: true };
    const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(jsonStr);
    
    // verifica se o token expirou
    const isExpired = Boolean(data.exp && data.exp * 1000 < Date.now());
    return { email: data.email || null, isExpired };
  } catch {
    return { email: null, isExpired: true };
  }
}

export const App: React.FC = () => {
  const [pronto, setPronto] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // se voltou do Genesys com o token na URL, salva e limpa a URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', '/');
      console.log('Auth - Login bem-sucedido, token recebido da Genesys');
    }

    const savedToken = localStorage.getItem('token');

    // se não tem token no storage vai para a tela de login do genesys
    if (!savedToken) {
      console.log('Auth - Sem token salvo, redirecionando para login');
      window.location.href = AUTH_LOGIN_URL;
      return;
    }

    const { email, isExpired } = parseTokenData(savedToken);
    if (!email || isExpired) {
      console.log('Auth - Token inválido, expirado ou corrompido, redirecionando para login');
      localStorage.removeItem('token');
      window.location.href = AUTH_LOGIN_URL;
      return;
    }

    setUserEmail(email);

    setMostrarSucesso(true);
    setTimeout(() => setMostrarSucesso(false), 3000);
    setPronto(true);
  }, []);

  if (!pronto) return null;

  return (
    <>
      <Slide in={mostrarSucesso} direction="right" mountOnEnter unmountOnExit timeout={400}>
        <Stack
          sx={{
            width: 'auto',
            maxWidth: '380px',
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 100,
          }}
          spacing={2}
        >
          <Alert
            severity="success"
            sx={{
              backgroundColor: '#aee297',
              color: '#25692d',
              borderRadius: '15px',
              border: '2px solid #99eba4',
            }}
          >
            {userEmail
              ? `Usuário autenticado: ${userEmail}`
              : 'Usuário autenticado com sucesso'}
          </Alert>
        </Stack>
      </Slide>
      <GerenciadorBucket />
    </>
  );
};

export default App;
import { useAuthStore } from './store';
import { authAPI } from './api';

export const login = async (email: string, password: string) => {
  const response = await authAPI.login(email, password);
  useAuthStore.getState().setAuth(
    response.user,
    response.access_token,
    response.refresh_token
  );
  return response;
};

export const register = async (email: string, name: string, password: string) => {
  const response = await authAPI.register(email, name, password);
  useAuthStore.getState().setAuth(
    response.user,
    response.access_token,
    response.refresh_token
  );
  return response;
};

export const logout = () => {
  useAuthStore.getState().clearAuth();
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return useAuthStore.getState().isAuthenticated();
};

export const getUser = () => {
  return useAuthStore.getState().user;
};
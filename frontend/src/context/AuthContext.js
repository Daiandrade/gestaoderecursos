import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result) {
        setUser(result.user);
        // Converter product_id string para array product_ids
        const profileWithArray = {
          ...result.profile,
          product_ids: result.profile.product_id
            ? result.profile.product_id.split(',').filter(id => id.trim())
            : []
        };
        setProfile(profileWithArray);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    // Converter product_id string para array product_ids
    const profileWithArray = {
      ...result.profile,
      product_ids: result.profile.product_id
        ? result.profile.product_id.split(',').filter(id => id.trim())
        : []
    };
    setProfile(profileWithArray);
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = () => profile?.role === 'admin';

  const canAccessProduct = (productId) => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.product_ids?.includes(productId) || false;
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    isAdmin,
    canAccessProduct,
    refreshProfile: loadCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

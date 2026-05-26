import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from './appwrite';

export const authService = {
  // Login com email e senha
  async login(email, password) {
    try {
      // Encerra qualquer sessão antiga
      try { await account.deleteSession('current'); } catch (e) { /* ignore */ }

      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const profile = await this.getUserProfile(user.$id);

      return {
        user,
        profile,
        session
      };
    } catch (error) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  // Buscar usuário atual (verifica sessão ativa)
  async getCurrentUser() {
    try {
      const user = await account.get();
      const profile = await this.getUserProfile(user.$id);
      return { user, profile };
    } catch (error) {
      return null;
    }
  },

  // Buscar perfil do usuário (role, product_id)
  async getUserProfile(userId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_PROFILES,
        [Query.equal('user_id', userId)]
      );
      return response.documents[0] || null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  },

  // Verificar se é admin
  isAdmin(profile) {
    return profile?.role === 'admin';
  },

  // Verificar se pode acessar produto
  canAccessProduct(profile, productId) {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    return profile.product_id === productId;
  }
};

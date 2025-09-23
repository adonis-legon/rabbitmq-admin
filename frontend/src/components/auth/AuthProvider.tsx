import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthContextType, UserInfo, LoginRequest } from "../../types/auth";
import { authService } from "../../services/auth/authService";
import { tokenService } from "../../services/auth/tokenService";
import { tokenExpirationHandler } from "../../services/tokenExpirationHandler";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();

    // Start token expiration monitoring
    tokenExpirationHandler.startMonitoring();

    return () => {
      tokenExpirationHandler.stopMonitoring();
    };
  }, []); // Empty dependency array - only run once on mount

  // Separate useEffect for token status listener to avoid stale closure
  useEffect(() => {
    const unsubscribe = tokenExpirationHandler.addListener((status) => {
      if (!status.isValid && user) {
        // Token is invalid and we have a user, clear the user state
        setUser(null);
      }
    });

    return unsubscribe;
  }, [user]); // This one can depend on user since it only sets up the listener

  const initializeAuth = async () => {
    try {
      if (tokenService.hasValidToken()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // If getCurrentUser returns null, clear tokens
          tokenService.clearTokens();
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      // Clear invalid tokens
      tokenService.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<UserInfo> => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);

      // Start token monitoring after successful login
      tokenExpirationHandler.startMonitoring();

      return response.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      // Stop token monitoring after logout
      tokenExpirationHandler.stopMonitoring();
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const success = await authService.refreshToken();
      if (!success) {
        setUser(null);
        throw new Error("Token refresh failed");
      }

      // Get updated user info after token refresh
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Token refresh failed:", error);
      setUser(null);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;

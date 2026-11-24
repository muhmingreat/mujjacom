
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "amanahToken";
const USER_KEY = "amanahUser";

function getStoredUser() {
  try {
    const value = sessionStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await api.getMe(token);

        if (!cancelled) {
          setUser(result.user);

          sessionStorage.setItem(
            USER_KEY,
            JSON.stringify(result.user)
          );
        }
          } catch (error) {
        if (!cancelled) {
          if (error.status === 401) {
            // The server rejected the authentication token.
            clearSession();
          } else {
            
            console.error(
              "Unable to restore authentication session:",
              error.message
            );
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const login = useCallback(async (credentials) => {
    const result = await api.login(credentials);

    sessionStorage.setItem(TOKEN_KEY, result.token);
    sessionStorage.setItem(
      USER_KEY,
      JSON.stringify(result.user)
    );

    setToken(result.token);
    setUser(result.user);

    return result;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((updatedUser) => {
  setUser(updatedUser);

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify(updatedUser)
  );
}, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}

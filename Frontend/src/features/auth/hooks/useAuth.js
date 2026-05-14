import { useContext,useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout ,me} from "../services/auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);

  const { user, setUser, loading, setLoading } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await login({ email, password });

      setUser(data.user);

      // ✅ ADDED: return true on success
      return true;

    } catch (err) {
      console.log(err);

      // ✅ ADDED: return false on failure
      return false;

    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });

      setUser(data.user);

      // ✅ ADDED
      return true;

    } catch (err) {
      console.log(err);

      // ✅ ADDED
      return false;

    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);

      // ✅ ADDED (optional but good)
      return true;

    } catch (err) {
      console.log(err);

      return false;

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const getAndSetUser = async () => {
    try {
      const data = await me();
      setUser(data.user);
    } catch (error) {
      console.log("Not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  getAndSetUser();
}, []);
  
  return { user, loading, handleLogin, handleRegister, handleLogout };
}; 
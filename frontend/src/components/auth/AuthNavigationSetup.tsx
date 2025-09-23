import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tokenExpirationHandler } from "../../services/tokenExpirationHandler";
import { ROUTES } from "../../utils/constants";

/**
 * Component to set up navigation for token expiration handler.
 * Must be rendered inside Router context.
 */
export const AuthNavigationSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up React Router navigation for token expiration handler
    tokenExpirationHandler.setNavigateToLogin((returnUrl) => {
      navigate(ROUTES.LOGIN, {
        state: { from: returnUrl || location.pathname + location.search },
        replace: true,
      });
    });

    // Cleanup function to remove navigation when component unmounts
    return () => {
      tokenExpirationHandler.setNavigateToLogin(undefined);
    };
  }, [navigate, location]);

  // This component doesn't render anything
  return null;
};

export default AuthNavigationSetup;

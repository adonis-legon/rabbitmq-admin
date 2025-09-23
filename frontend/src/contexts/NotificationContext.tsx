import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from "@mui/material";
import { setGlobalNotificationService } from "../services/notificationService";

export type NotificationType = AlertColor;

interface NotificationState {
  open: boolean;
  message: string;
  type: NotificationType;
  autoHideDuration?: number;
}

interface NotificationContextType {
  showNotification: (
    message: string,
    type: NotificationType,
    autoHideDuration?: number
  ) => void;
  success: (message: string, autoHideDuration?: number) => void;
  error: (message: string, autoHideDuration?: number) => void;
  warning: (message: string, autoHideDuration?: number) => void;
  info: (message: string, autoHideDuration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    type: "info",
    autoHideDuration: 6000,
  });

  const showNotification = useCallback(
    (
      message: string,
      type: NotificationType,
      autoHideDuration: number = 6000
    ) => {
      setNotification({
        open: true,
        message,
        type,
        autoHideDuration,
      });
    },
    []
  );

  const success = useCallback(
    (message: string, autoHideDuration?: number) => {
      showNotification(message, "success", autoHideDuration);
    },
    [showNotification]
  );

  const error = useCallback(
    (message: string, autoHideDuration?: number) => {
      showNotification(message, "error", autoHideDuration || 8000); // Errors stay longer
    },
    [showNotification]
  );

  const warning = useCallback(
    (message: string, autoHideDuration?: number) => {
      showNotification(message, "warning", autoHideDuration);
    },
    [showNotification]
  );

  const info = useCallback(
    (message: string, autoHideDuration?: number) => {
      showNotification(message, "info", autoHideDuration);
    },
    [showNotification]
  );

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const contextValue: NotificationContextType = {
    showNotification,
    success,
    error,
    warning,
    info,
  };

  // Initialize the global notification service
  useEffect(() => {
    setGlobalNotificationService({
      success,
      error,
      warning,
      info,
    });
  }, [success, error, warning, info]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          "& .MuiSnackbar-root": {
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
          },
        }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.type}
          variant="filled"
          sx={{
            width: "100%",
            fontSize: { xs: "0.875rem", sm: "1rem" },
            "& .MuiAlert-message": {
              padding: { xs: "4px 0", sm: "8px 0" },
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationProvider;

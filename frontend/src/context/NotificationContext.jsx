import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        return addToast(message, "success", duration || 3000);
    }, [addToast]);

    const showError = useCallback((message, duration) => {
        return addToast(message, "error", duration || 4000);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        return addToast(message, "warning", duration || 4000);
    }, [addToast]);

    const showInfo = useCallback((message, duration) => {
        return addToast(message, "info", duration || 4000);
    }, [addToast]);

    const showConfirm = useCallback((message) => {
        return new Promise((resolve) => {
            const confirmId = Date.now() + Math.random();
            const toastElement = document.createElement("div");
            toastElement.className = "toast-confirm-overlay";
            toastElement.innerHTML = `
                <div class="toast-confirm-dialog">
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn-cancel">Cancel</button>
                        <button class="btn-confirm">Confirm</button>
                    </div>
                </div>
            `;

            document.body.appendChild(toastElement);

            const cancelBtn = toastElement.querySelector(".btn-cancel");
            const confirmBtn = toastElement.querySelector(".btn-confirm");

            const cleanup = () => {
                toastElement.remove();
            };

            cancelBtn.addEventListener("click", () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener("click", () => {
                cleanup();
                resolve(true);
            });

            // Close on escape
            const handleEscape = (e) => {
                if (e.key === "Escape") {
                    document.removeEventListener("keydown", handleEscape);
                    cleanup();
                    resolve(false);
                }
            };
            document.addEventListener("keydown", handleEscape);
        });
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                toasts,
                addToast,
                removeToast,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                showConfirm,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return context;
};

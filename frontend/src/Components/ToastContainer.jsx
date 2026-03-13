import React from "react";
import Toast from "./Toast";
import { useNotification } from "../context/NotificationContext";
import "./Toast.css";

const ToastContainer = () => {
    const { toasts, removeToast } = useNotification();

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;

import React, { useState, useEffect } from "react";
import "./Toast.css";
import { IoClose } from "react-icons/io5";
import { MdCheckCircle, MdError, MdInfo, MdWarning } from "react-icons/md";

const Toast = ({ id, message, type = "info", duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => onClose(id), 300);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return <MdCheckCircle className="toast-icon" />;
            case "error":
                return <MdError className="toast-icon" />;
            case "warning":
                return <MdWarning className="toast-icon" />;
            case "info":
            default:
                return <MdInfo className="toast-icon" />;
        }
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? "show" : "hide"}`}>
            <div className="toast-content">
                {getIcon()}
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={handleClose} aria-label="Close">
                <IoClose />
            </button>
        </div>
    );
};

export default Toast;

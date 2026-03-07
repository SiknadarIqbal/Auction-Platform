import React from "react";

const Button = ({ children, onClick, type = "button", className = "" }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 transition duration-200 ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;

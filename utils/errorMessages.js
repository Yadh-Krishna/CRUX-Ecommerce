const ERROR_MESSAGES = Object.freeze({
    USER: {
        NOT_FOUND: "User not found.",
        ALREADY_EXISTS: "User already exists.",
        INVALID_CREDENTIALS: "Invalid email or password.",
        UNAUTHORIZED: "Unauthorized access.",
        BLOCKED: "Your account has been blocked. Please contact support."
    },
    PRODUCT: {
        NOT_FOUND: "Product not found.",
        OUT_OF_STOCK: "Product is out of stock.",
        INVALID_CATEGORY: "Invalid category selected."
    },
    CATEGORY: {
        NOT_FOUND: "Category not found.",
        DUPLICATE: "Category already exists."
    },
    ORDER: {
        NOT_FOUND: "Order not found.",
        PAYMENT_FAILED: "Payment failed. Please try again."
    },
    AUTH: {
        INVALID_TOKEN: "Invalid or expired token.",
        NO_TOKEN: "Token is required for authentication.",
        OTP_EXPIRED: "OTP has expired. Request a new one.",
        OTP_INVALID: "Invalid OTP. Please try again."
    },
    GENERAL: {
        BAD_REQUEST: "Invalid request.",
        SERVER_ERROR: "Something went wrong. Please try again later.",
        FORBIDDEN: "You don't have permission to access this resource."
    }
});

module.exports = ERROR_MESSAGES;
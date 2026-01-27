export var PASSWORD_REQUIREMENTS = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
export function isPasswordStrong(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

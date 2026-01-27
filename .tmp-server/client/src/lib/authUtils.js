export function isUnauthorizedError(error) {
    return /^401: .*Unauthorized/.test(error.message);
}

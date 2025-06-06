"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ClaimsError = void 0;
// Error types
class ClaimsError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'ClaimsError';
    }
}
exports.ClaimsError = ClaimsError;
class ValidationError extends ClaimsError {
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ClaimsError {
    constructor(resource, id) {
        super(`${resource} with ID ${id} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ClaimsError {
    constructor() {
        super('Unauthorized access to claim', 'UNAUTHORIZED', 403);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;

export enum HTTP_STATUS {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500
}

export const RESPONSE_MESSAGES = {
    SUCCESS: 'Success',
    UNKNOWN_ERROR: 'An unknown error occurred',
    AUTH_REQUIRED: 'Authentication required',
    INVALID_TOKEN: 'Invalid or expired token',
    API_NOT_FOUND: 'API endpoint not found',
    NO_FILE_PROVIDED: 'No file data provided.',
    UPLOAD_FAILED: 'Upload failed. Please try again.',
    INVALID_URL: 'Invalid URL',
    DOWNLOAD_FAILED: 'Download failed',
    INVALID_CREDENTIALS: 'Invalid credentials',
    NOT_AUTHENTICATED: 'Not authenticated',
    USER_NOT_FOUND: 'User not found',
    POLL_NOT_FOUND: 'Poll not found',
    LOGGED_OUT: 'Logged out successfully',
    ALL_FIELDS_REQUIRED: 'All fields are required',
    EMAIL_ALREADY_REGISTERED: 'Email already registered',
    NAME_CANNOT_BE_EMPTY: 'Name cannot be empty',
    MESSAGE_CANNOT_BE_EMPTY: 'Message cannot be empty',
    INVALID_POLL_OPTIONS: 'Poll must have a question and at least 2 options.',
};

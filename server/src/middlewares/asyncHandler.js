/**
 * ⚡ ASYNC HANDLER (SENIOR WRAPPER)
 * Eliminates the need for try/catch blocks in express controllers.
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;

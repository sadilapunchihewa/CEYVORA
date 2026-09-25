namespace backend.Services;

// Only messages intentionally written for upload clients may be returned as validation errors.
public sealed class ImageValidationException(string message) : Exception(message);

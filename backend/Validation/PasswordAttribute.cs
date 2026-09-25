using System.ComponentModel.DataAnnotations;
using System.Text;

namespace backend.Validation;

public sealed class PasswordAttribute : ValidationAttribute
{
    public PasswordAttribute() : base("Password must contain at least 8 characters, a letter and a digit, and at most 72 UTF-8 bytes.") { }

    public override bool IsValid(object? value) => value is string password
        && password.Length >= 8 && Encoding.UTF8.GetByteCount(password) <= 72
        && password.Any(char.IsLetter) && password.Any(char.IsDigit)
        && !password.Contains('\0');
}

namespace BuildingBlocks.Common.Results;

public record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "The specified result value is null.");
    public static readonly Error ConditionNotMet = new("Error.ConditionNotMet", "The specified condition was not met.");

    public static Error NotFound(string entityName, object key) =>
        new($"{entityName}.NotFound", $"{entityName} with key '{key}' was not found.");

    public static Error Conflict(string message) =>
        new("Error.Conflict", message);

    public static Error Validation(string code, string message) =>
        new(code, message);
}

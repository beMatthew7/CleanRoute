namespace CleanRoute.Domain;

public abstract class Entity<TId>
{
    public TId Id { get; set; } = default;
}
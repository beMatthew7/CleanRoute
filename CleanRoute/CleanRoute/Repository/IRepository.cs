using CleanRoute.Domain;

namespace CleanRoute.Repository;

public interface IRepository<TId, TEntity> where TEntity : Entity<TId>
{
    Task<TEntity?> GetOneAsync(TId id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    Task AddAsync(TEntity entity);
    Task UpdateAsync(TEntity entity);
    Task DeleteAsync(TId id);
}
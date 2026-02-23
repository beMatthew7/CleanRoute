using Microsoft.EntityFrameworkCore;
using CleanRoute.Domain;
namespace CleanRoute.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!; 
}
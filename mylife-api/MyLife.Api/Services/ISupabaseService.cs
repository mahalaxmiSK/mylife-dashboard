public interface ISupabaseService
{
    Task<T?> GetAsync<T>(string table, string? query = null);
    Task<T?> InsertAsync<T>(string table, object payload);
    Task<T?> UpdateAsync<T>(string table, string filter, object payload);
    Task DeleteAsync(string table, string filter);
}

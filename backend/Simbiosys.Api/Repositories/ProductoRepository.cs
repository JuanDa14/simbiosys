using Dapper;
using Simbiosys.Api.Data;
using Simbiosys.Api.Models;

namespace Simbiosys.Api.Repositories;

public sealed class ProductoRepository : IProductoRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public ProductoRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<ProductoDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT Id, Codigo, Nombre, Precio, Stock
            FROM dbo.Productos
            ORDER BY Nombre;
            """;

        using var connection = _connectionFactory.CreateConnection();
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        var products = await connection.QueryAsync<ProductoDto>(command);
        return products.AsList();
    }
}

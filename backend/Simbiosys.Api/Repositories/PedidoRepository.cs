using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Simbiosys.Api.Data;
using Simbiosys.Api.Models;

namespace Simbiosys.Api.Repositories;

public sealed class PedidoRepository : IPedidoRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public PedidoRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<PedidoDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string pedidosSql = """
            SELECT Id, CodigoPedido, Cliente, Fecha, Total, Estado
            FROM dbo.Pedidos
            ORDER BY Fecha DESC;
            """;

        const string detallesSql = """
            SELECT
                d.Id,
                d.PedidoId,
                d.ProductoId,
                pr.Nombre AS ProductoNombre,
                d.Cantidad,
                d.PrecioUnitario,
                d.SubTotal
            FROM dbo.DetallePedidos d
            INNER JOIN dbo.Productos pr ON pr.Id = d.ProductoId
            ORDER BY d.PedidoId, d.Id;
            """;

        using var connection = _connectionFactory.CreateConnection();

        var pedidos = (await connection.QueryAsync<PedidoDto>(
            new CommandDefinition(pedidosSql, cancellationToken: cancellationToken))).AsList();

        var detalles = await connection.QueryAsync<DetallePedidoRow>(
            new CommandDefinition(detallesSql, cancellationToken: cancellationToken));

        var detallesPorPedido = detalles
            .GroupBy(d => d.PedidoId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<DetallePedidoDto>)g.Select(d => new DetallePedidoDto
                {
                    Id = d.Id,
                    ProductoId = d.ProductoId,
                    ProductoNombre = d.ProductoNombre,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    SubTotal = d.SubTotal
                }).ToList());

        foreach (var pedido in pedidos)
        {
            pedido.Detalles = detallesPorPedido.TryGetValue(pedido.Id, out var items)
                ? items
                : Array.Empty<DetallePedidoDto>();
        }

        return pedidos;
    }

    public async Task<CrearPedidoResponse> RegistrarAsync(
        CrearPedidoRequest request,
        CancellationToken cancellationToken = default)
    {
        using var connection = (SqlConnection)_connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var detalleTable = new DataTable();
        detalleTable.Columns.Add("ProductoId", typeof(int));
        detalleTable.Columns.Add("Cantidad", typeof(int));

        foreach (var item in request.Items)
        {
            detalleTable.Rows.Add(item.ProductoId, item.Cantidad);
        }

        var parameters = new DynamicParameters();
        parameters.Add("@Cliente", request.Cliente.Trim());
        parameters.Add("@Detalle", detalleTable.AsTableValuedParameter("dbo.DetallePedidoType"));
        parameters.Add("@PedidoId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("@CodigoPedido", dbType: DbType.String, size: 50, direction: ParameterDirection.Output);
        parameters.Add("@Total", dbType: DbType.Decimal, precision: 18, scale: 2, direction: ParameterDirection.Output);

        var command = new CommandDefinition(
            "dbo.sp_RegistrarPedido",
            parameters,
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        await connection.ExecuteAsync(command);

        return new CrearPedidoResponse
        {
            Id = parameters.Get<int>("@PedidoId"),
            CodigoPedido = parameters.Get<string>("@CodigoPedido"),
            Total = parameters.Get<decimal>("@Total"),
            Estado = "COMPLETADO"
        };
    }

    private sealed class DetallePedidoRow
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int ProductoId { get; set; }
        public string? ProductoNombre { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal SubTotal { get; set; }
    }
}

namespace Simbiosys.Api.Models;

public sealed class PedidoDto
{
    public int Id { get; set; }
    public string CodigoPedido { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
    public IReadOnlyList<DetallePedidoDto> Detalles { get; set; } = Array.Empty<DetallePedidoDto>();
}

public sealed class DetallePedidoDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string? ProductoNombre { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal SubTotal { get; set; }
}

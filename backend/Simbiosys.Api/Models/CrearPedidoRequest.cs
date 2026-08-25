using System.ComponentModel.DataAnnotations;

namespace Simbiosys.Api.Models;

public sealed class CrearPedidoRequest
{
    [Required(ErrorMessage = "El nombre del cliente es obligatorio.")]
    [MaxLength(120)]
    public string Cliente { get; set; } = string.Empty;

    [Required]
    [MinLength(1, ErrorMessage = "El pedido debe incluir al menos un producto.")]
    public List<CrearPedidoItemRequest> Items { get; set; } = new();
}

public sealed class CrearPedidoItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public int Cantidad { get; set; }
}

public sealed class CrearPedidoResponse
{
    public int Id { get; set; }
    public string CodigoPedido { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Estado { get; set; } = "COMPLETADO";
}

public sealed class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
}

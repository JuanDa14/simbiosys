using Microsoft.Data.SqlClient;
using Simbiosys.Api.Models;
using Simbiosys.Api.Repositories;

namespace Simbiosys.Api.Services;

public sealed class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _pedidoRepository;

    public PedidoService(IPedidoRepository pedidoRepository)
    {
        _pedidoRepository = pedidoRepository;
    }

    public Task<IReadOnlyList<PedidoDto>> GetAllAsync(CancellationToken cancellationToken = default)
        => _pedidoRepository.GetAllAsync(cancellationToken);

    public async Task<CrearPedidoResponse> CrearAsync(
        CrearPedidoRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Cliente))
        {
            throw new BusinessException("El nombre del cliente es obligatorio.");
        }

        if (request.Items is null || request.Items.Count == 0)
        {
            throw new BusinessException("El pedido debe incluir al menos un producto.");
        }

        if (request.Items.Any(i => i.ProductoId <= 0 || i.Cantidad <= 0))
        {
            throw new BusinessException("Cada ítem debe tener productoId y cantidad válidos.");
        }

        try
        {
            return await _pedidoRepository.RegistrarAsync(request, cancellationToken);
        }
        catch (SqlException ex)
        {
            throw new BusinessException(ex.Message, ex);
        }
    }
}

public sealed class BusinessException : Exception
{
    public BusinessException(string message) : base(message)
    {
    }

    public BusinessException(string message, Exception innerException) : base(message, innerException)
    {
    }
}

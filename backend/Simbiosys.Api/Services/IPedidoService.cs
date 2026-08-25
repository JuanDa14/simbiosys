using Simbiosys.Api.Models;

namespace Simbiosys.Api.Services;

public interface IPedidoService
{
    Task<IReadOnlyList<PedidoDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CrearPedidoResponse> CrearAsync(CrearPedidoRequest request, CancellationToken cancellationToken = default);
}

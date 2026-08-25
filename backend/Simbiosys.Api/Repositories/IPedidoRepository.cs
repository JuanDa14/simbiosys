using Simbiosys.Api.Models;

namespace Simbiosys.Api.Repositories;

public interface IPedidoRepository
{
    Task<IReadOnlyList<PedidoDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CrearPedidoResponse> RegistrarAsync(CrearPedidoRequest request, CancellationToken cancellationToken = default);
}

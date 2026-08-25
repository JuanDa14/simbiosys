using Simbiosys.Api.Models;

namespace Simbiosys.Api.Repositories;

public interface IProductoRepository
{
    Task<IReadOnlyList<ProductoDto>> GetAllAsync(CancellationToken cancellationToken = default);
}

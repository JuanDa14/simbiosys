using Microsoft.AspNetCore.Mvc;
using Simbiosys.Api.Models;
using Simbiosys.Api.Repositories;

namespace Simbiosys.Api.Controllers;

[ApiController]
[Route("api/v1/productos")]
public sealed class ProductosController : ControllerBase
{
    private readonly IProductoRepository _productoRepository;

    public ProductosController(IProductoRepository productoRepository)
    {
        _productoRepository = productoRepository;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProductoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProductoDto>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var productos = await _productoRepository.GetAllAsync(cancellationToken);
        return Ok(productos);
    }
}

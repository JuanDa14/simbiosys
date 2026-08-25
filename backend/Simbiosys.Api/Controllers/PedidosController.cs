using Microsoft.AspNetCore.Mvc;
using Simbiosys.Api.Models;
using Simbiosys.Api.Services;

namespace Simbiosys.Api.Controllers;

[ApiController]
[Route("api/v1/pedidos")]
public sealed class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;

    public PedidosController(IPedidoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PedidoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PedidoDto>>> GetAllAsync(CancellationToken cancellationToken)
    {
        var pedidos = await _pedidoService.GetAllAsync(cancellationToken);
        return Ok(pedidos);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CrearPedidoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CrearPedidoResponse>> CrearAsync(
        [FromBody] CrearPedidoRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(m => !string.IsNullOrWhiteSpace(m));

            return BadRequest(new ErrorResponse
            {
                Message = string.Join(" ", errors)
            });
        }

        try
        {
            var created = await _pedidoService.CrearAsync(request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, created);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
    }
}

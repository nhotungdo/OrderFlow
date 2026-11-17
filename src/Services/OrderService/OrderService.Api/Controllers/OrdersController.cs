using BuildingBlocks.Idempotency;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using OrderService.Application.Commands.CreateOrder;
using OrderService.Application.DTOs;

namespace OrderService.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly ISender _sender;

    public OrdersController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Creates a new distributed order with strict idempotency guard (X-Idempotency-Key).
    /// </summary>
    [HttpPost]
    [Idempotent]
    [ProducesResponseType(typeof(OrderResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var idempotencyKey = Request.Headers["X-Idempotency-Key"].ToString();

        var command = new CreateOrderCommand(
            request.CustomerId,
            request.PaymentMethod,
            idempotencyKey,
            request.Items);

        var result = await _sender.Send(command);

        if (result.IsFailure)
        {
            return result.Error.Code.Contains("Conflict")
                ? Conflict(new { error = result.Error.Message })
                : BadRequest(new { error = result.Error.Message });
        }

        return CreatedAtAction("CreateOrder", new { id = result.Value.Id }, result.Value);
    }
}

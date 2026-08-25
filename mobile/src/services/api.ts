import { API_BASE_URL } from '../config';
import type {
  ApiErrorBody,
  CreateOrderPayload,
  CreateOrderResponse,
  Order,
  Product,
} from '../types';

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body?.message) {
      return body.message;
    }
  } catch {
    // ignore JSON parse errors
  }
  return `Error HTTP ${response.status}`;
}

export async function getProductos(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/productos`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Product[];
}

export async function getPedidos(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/pedidos`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as Order[];
}

export async function crearPedido(
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as CreateOrderResponse;
}
